import { Injectable } from '@nestjs/common';
import { ContentStatus, StreamStatus, VideoType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { VIDEO_CARD_SELECT } from '../common/mappers/content.mapper';
import {
  clampLimit,
  clampPage,
  paginationSkip,
} from '../common/utils/pagination.util';
import {
  ContentServicesService,
  contentServiceForVideoType,
} from '../content-services/content-services.service';
import type { ContentServicesSettings } from '../platform-settings/platform-settings.types';
import { PlaybackService } from '../playback/playback.service';
import { PrismaService } from '../prisma/prisma.service';
import { StreamsService } from '../streams/streams.service';

const HOME_FEED_CACHE_TTL_SECONDS = 45;

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streams: StreamsService,
    private readonly playback: PlaybackService,
    private readonly contentServices: ContentServicesService,
    private readonly cache: RedisCacheService,
  ) {}

  async home(userId?: string) {
    const cacheKey = `feed:home:${userId ?? 'anon'}`;
    const cached = await this.cache.getJson<Awaited<ReturnType<FeedService['buildHome']>>>(
      cacheKey,
    );
    if (cached) return cached;

    const payload = await this.buildHome(userId);
    await this.cache.setJson(cacheKey, payload, HOME_FEED_CACHE_TTL_SECONDS);
    return payload;
  }

  private async buildHome(userId?: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const services = await this.contentServices.get();
    const moviesEnabled = services.movies;
    const videosEnabled = services.videos;
    const shortsEnabled = services.shorts;
    const verticalsEnabled = services.verticals;

    const videoTypes: VideoType[] = [];
    if (videosEnabled) videoTypes.push(VideoType.video);
    if (shortsEnabled) videoTypes.push(VideoType.short);

    const [liveStreams, movies, newReleaseMovies, videos, newestMovie, topMovie, continueWatching] =
      await Promise.all([
      this.prisma.stream.findMany({
        where: { status: StreamStatus.live },
        orderBy: { viewerCount: 'desc' },
        take: 12,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      moviesEnabled
        ? this.prisma.video.findMany({
        where: { type: VideoType.movie, status: ContentStatus.ready, visibility: 'public' },
        orderBy: { viewsCount: 'desc' },
        take: 12,
        select: VIDEO_CARD_SELECT,
      })
        : Promise.resolve([]),
      moviesEnabled
        ? this.prisma.video.findMany({
        where: { type: VideoType.movie, status: ContentStatus.ready, visibility: 'public' },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: VIDEO_CARD_SELECT,
      })
        : Promise.resolve([]),
      videoTypes.length
        ? this.prisma.video.findMany({
        where: {
          type: { in: videoTypes },
          status: ContentStatus.ready,
          visibility: 'public',
        },
        orderBy: { viewsCount: 'desc' },
        take: 16,
        select: VIDEO_CARD_SELECT,
      })
        : Promise.resolve([]),
      moviesEnabled
        ? this.prisma.video.findFirst({
        where: {
          type: VideoType.movie,
          status: ContentStatus.ready,
          visibility: 'public',
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        select: VIDEO_CARD_SELECT,
      })
        : Promise.resolve(null),
      moviesEnabled
        ? this.prisma.video.findFirst({
        where: { type: VideoType.movie, status: ContentStatus.ready, visibility: 'public' },
        orderBy: { viewsCount: 'desc' },
        select: VIDEO_CARD_SELECT,
      })
        : Promise.resolve(null),
      userId && (videosEnabled || verticalsEnabled)
        ? this.continueWatching(userId, 12, services)
        : Promise.resolve([]),
    ]);

    const heroMovie = newestMovie ?? (topMovie && topMovie.viewsCount > 0 ? topMovie : null);
    const heroMovieReason = newestMovie
      ? 'new_release'
      : topMovie && topMovie.viewsCount > 0
        ? 'trending'
        : null;

    const [trending, newReleases, moviesCards, featuredMovieCard] =
      await Promise.all([
        this.playback.mapVideoCardsWithPlayback(videos),
        this.playback.mapVideoCardsWithPlayback(newReleaseMovies),
        this.playback.mapVideoCardsWithPlayback(movies),
        heroMovie
          ? this.playback.mapVideoCardWithPlayback(heroMovie)
          : Promise.resolve(null),
      ]);

    const mappedLive = await this.streams.mapStreams(liveStreams, userId);

    return {
      liveNow: mappedLive.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        thumbnailUrl: s.thumbnail,
        hlsPlaybackUrl: s.hlsPlaybackUrl,
        streamer: s.streamer,
        streamerSlug: s.streamerSlug,
        streamerAvatar: s.streamerAvatar,
        viewers: s.viewerCount,
        category: s.category,
        accessType: s.accessType,
        entryPriceUsd: s.entryPriceUsd,
        entryCoinCost: s.entryCoinCost,
        isPaid: s.isPaid,
        hasAccess: s.hasAccess,
      })),
      continueWatching,
      featuredLive: mappedLive[0]
        ? {
            id: mappedLive[0].id,
            slug: mappedLive[0].slug,
            title: mappedLive[0].title,
            thumbnailUrl: mappedLive[0].thumbnail,
            hlsPlaybackUrl: mappedLive[0].hlsPlaybackUrl,
            streamer: mappedLive[0].streamer,
            streamerAvatar: mappedLive[0].streamerAvatar,
            viewerCount: mappedLive[0].viewerCount,
            accessType: mappedLive[0].accessType,
            entryPriceUsd: mappedLive[0].entryPriceUsd,
            entryCoinCost: mappedLive[0].entryCoinCost,
            isPaid: mappedLive[0].isPaid,
            hasAccess: mappedLive[0].hasAccess,
          }
        : null,
      trending,
      newReleases,
      movies: moviesCards,
      featuredMovie: featuredMovieCard,
      heroMovieReason,
    };
  }

  private async continueWatching(
    userId: string,
    limit = 12,
    services?: ContentServicesSettings,
  ) {
    const enabled = services ?? (await this.contentServices.get());
    const contentTypes: Array<'video' | 'vertical_episode'> = [];
    if (enabled.videos || enabled.movies || enabled.shorts) contentTypes.push('video');
    if (enabled.verticals) contentTypes.push('vertical_episode');
    if (!contentTypes.length) return [];

    const rows = await this.prisma.watchHistory.findMany({
      where: {
        userId,
        completed: false,
        contentType: { in: contentTypes },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit * 2,
    });
    if (!rows.length) return [];

    const videoIds = rows
      .filter((r) => r.contentType === 'video')
      .map((r) => r.contentId);
    const verticalIds = rows
      .filter((r) => r.contentType === 'vertical_episode')
      .map((r) => r.contentId);

    const [videos, verticalEpisodes] = await Promise.all([
      videoIds.length
        ? this.prisma.video.findMany({
            where: {
              id: { in: videoIds },
              type: { in: [VideoType.video, VideoType.movie, VideoType.series_episode] },
            },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              durationSeconds: true,
              type: true,
            },
          })
        : [],
      verticalIds.length
        ? this.prisma.verticalEpisode.findMany({
            where: { id: { in: verticalIds } },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              durationSeconds: true,
              episodeNumber: true,
              series: { select: { slug: true, title: true, posterUrl: true } },
            },
          })
        : [],
    ]);

    const videoById = new Map(videos.map((v) => [v.id, v]));
    const verticalById = new Map(verticalEpisodes.map((e) => [e.id, e]));

    const items = rows
      .map((r) => {
        if (r.contentType === 'video') {
          const v = videoById.get(r.contentId);
          if (!v) return null;
          if (!enabled[contentServiceForVideoType(v.type)]) return null;
          return {
            contentType: 'video' as const,
            contentId: r.contentId,
            progressSeconds: r.progressSeconds,
            completed: r.completed,
            title: v.title,
            thumbnailUrl: this.playback.resolvePublicAssetUrl(v.thumbnailUrl),
            durationSeconds: v.durationSeconds,
            videoType: v.type,
          };
        }
        if (r.contentType === 'vertical_episode') {
          const ep = verticalById.get(r.contentId);
          if (!ep) return null;
          return {
            contentType: 'vertical_episode' as const,
            contentId: r.contentId,
            progressSeconds: r.progressSeconds,
            completed: r.completed,
            title: ep.title,
            thumbnailUrl:
              this.playback.resolvePublicAssetUrl(ep.thumbnailUrl) ??
              this.playback.resolvePublicAssetUrl(ep.series.posterUrl),
            durationSeconds: ep.durationSeconds,
            subtitle: `${ep.series.title} · Ep ${ep.episodeNumber}`,
            seriesSlug: ep.series.slug,
            episodeNumber: ep.episodeNumber,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return items.slice(0, limit);
  }

  async trending(pageInput = 1, limitInput = 20) {
    const page = clampPage(pageInput);
    const limit = clampLimit(limitInput);
    const skip = paginationSkip(page, limit);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [rankedRows, totalRow] = await Promise.all([
      this.prisma.$queryRaw<Array<{ target_id: string; cnt: bigint }>>(Prisma.sql`
        SELECT target_id, COUNT(*)::bigint AS cnt
        FROM analytics_events
        WHERE event_type = 'view'
          AND created_at >= ${since7d}
          AND target_id IS NOT NULL
        GROUP BY target_id
        ORDER BY cnt DESC
        OFFSET ${skip}
        LIMIT ${limit}
      `),
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (
          SELECT target_id
          FROM analytics_events
          WHERE event_type = 'view'
            AND created_at >= ${since7d}
            AND target_id IS NOT NULL
          GROUP BY target_id
        ) ranked
      `),
    ]);

    const rankedIds = rankedRows.map((row) => row.target_id).filter(Boolean);
    const rankedTotal = Number(totalRow[0]?.total ?? 0);

    if (rankedIds.length > 0) {
      const videos = await this.prisma.video.findMany({
        where: {
          id: { in: rankedIds },
          status: ContentStatus.ready,
          visibility: 'public',
        },
        select: VIDEO_CARD_SELECT,
      });
      const byId = new Map(videos.map((video) => [video.id, video]));
      const items = await this.playback.mapVideoCardsWithPlayback(
        rankedIds
          .map((id) => byId.get(id))
          .filter((video): video is NonNullable<typeof video> => !!video),
      );

      return {
        items,
        meta: { page, limit, total: rankedTotal },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { status: ContentStatus.ready, visibility: 'public' },
        orderBy: { viewsCount: 'desc' },
        skip,
        take: limit,
        select: VIDEO_CARD_SELECT,
      }),
      this.prisma.video.count({
        where: { status: ContentStatus.ready, visibility: 'public' },
      }),
    ]);
    return {
      items: await this.playback.mapVideoCardsWithPlayback(items),
      meta: { page, limit, total },
    };
  }
}
