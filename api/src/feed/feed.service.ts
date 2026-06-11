import { Injectable } from '@nestjs/common';
import { AnalyticsEventType, ContentStatus, StreamStatus, VideoType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapVideoCard, VIDEO_CARD_SELECT } from '../common/mappers/content.mapper';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async home(userId?: string) {
    const [liveStreams, movies, videos, featuredMovie, continueWatching] =
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
      this.prisma.video.findMany({
        where: { type: VideoType.movie, status: ContentStatus.ready, visibility: 'public' },
        orderBy: { viewsCount: 'desc' },
        take: 12,
        select: VIDEO_CARD_SELECT,
      }),
      this.prisma.video.findMany({
        where: {
          type: { in: [VideoType.video, VideoType.short] },
          status: ContentStatus.ready,
          visibility: 'public',
        },
        orderBy: { viewsCount: 'desc' },
        take: 16,
        select: VIDEO_CARD_SELECT,
      }),
      this.prisma.video.findFirst({
        where: { type: VideoType.movie, status: ContentStatus.ready },
        orderBy: { createdAt: 'desc' },
        select: VIDEO_CARD_SELECT,
      }),
      userId ? this.continueWatching(userId) : Promise.resolve([]),
    ]);

    return {
      liveNow: liveStreams.map((s) => ({
        id: s.id,
        slug: s.creator.username,
        title: s.title,
        thumbnailUrl: s.thumbnailUrl,
        streamer: s.creator.displayName ?? s.creator.username,
        streamerSlug: s.creator.username,
        streamerAvatar: s.creator.avatarUrl,
        viewers: s.viewerCount,
        category: s.category,
      })),
      continueWatching,
      featuredLive: liveStreams[0]
        ? {
            id: liveStreams[0].id,
            slug: liveStreams[0].creator.username,
            title: liveStreams[0].title,
            thumbnailUrl: liveStreams[0].thumbnailUrl,
            streamer: liveStreams[0].creator.displayName ?? liveStreams[0].creator.username,
            viewerCount: liveStreams[0].viewerCount,
          }
        : null,
      trending: videos.map(mapVideoCard),
      newReleases: movies.slice(0, 8).map(mapVideoCard),
      movies: movies.map(mapVideoCard),
      featuredMovie: featuredMovie ? mapVideoCard(featuredMovie) : null,
    };
  }

  private async continueWatching(userId: string, limit = 12) {
    const rows = await this.prisma.watchHistory.findMany({
      where: { userId, completed: false },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    if (!rows.length) return [];

    const videoIds = rows
      .filter((r) => r.contentType === 'video')
      .map((r) => r.contentId);
    const podcastIds = rows
      .filter((r) => r.contentType === 'podcast_episode')
      .map((r) => r.contentId);
    const verticalIds = rows
      .filter((r) => r.contentType === 'vertical_episode')
      .map((r) => r.contentId);

    const [videos, episodes, verticalEpisodes] = await Promise.all([
      videoIds.length
        ? this.prisma.video.findMany({
            where: { id: { in: videoIds } },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              durationSeconds: true,
            },
          })
        : [],
      podcastIds.length
        ? this.prisma.podcastEpisode.findMany({
            where: { id: { in: podcastIds } },
            select: {
              id: true,
              title: true,
              coverUrl: true,
              durationSeconds: true,
              show: { select: { title: true } },
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
    const episodeById = new Map(episodes.map((e) => [e.id, e]));
    const verticalById = new Map(verticalEpisodes.map((e) => [e.id, e]));

    return rows
      .map((r) => {
        if (r.contentType === 'video') {
          const v = videoById.get(r.contentId);
          if (!v) return null;
          return {
            contentType: 'video' as const,
            contentId: r.contentId,
            progressSeconds: r.progressSeconds,
            completed: r.completed,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            durationSeconds: v.durationSeconds,
          };
        }
        if (r.contentType === 'podcast_episode') {
          const ep = episodeById.get(r.contentId);
          if (!ep) return null;
          return {
            contentType: 'podcast_episode' as const,
            contentId: r.contentId,
            progressSeconds: r.progressSeconds,
            completed: r.completed,
            title: ep.title,
            thumbnailUrl: ep.coverUrl,
            durationSeconds: ep.durationSeconds,
            subtitle: ep.show.title,
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
            thumbnailUrl: ep.thumbnailUrl ?? ep.series.posterUrl,
            durationSeconds: ep.durationSeconds,
            subtitle: `${ep.series.title} · Ep ${ep.episodeNumber}`,
            seriesSlug: ep.series.slug,
            episodeNumber: ep.episodeNumber,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  async trending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['targetId'],
      where: {
        eventType: AnalyticsEventType.view,
        createdAt: { gte: since7d },
        targetId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { targetId: 'desc' } },
    });

    const rankedIds = grouped
      .map((row) => row.targetId)
      .filter((id): id is string => !!id);

    if (rankedIds.length > 0) {
      const pageIds = rankedIds.slice(skip, skip + limit);
      const videos = await this.prisma.video.findMany({
        where: {
          id: { in: pageIds },
          status: ContentStatus.ready,
          visibility: 'public',
        },
        select: VIDEO_CARD_SELECT,
      });
      const byId = new Map(videos.map((video) => [video.id, video]));
      const items = pageIds
        .map((id) => byId.get(id))
        .filter((video): video is NonNullable<typeof video> => !!video)
        .map(mapVideoCard);

      return {
        items,
        meta: { page, limit, total: rankedIds.length },
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
      items: items.map(mapVideoCard),
      meta: { page, limit, total },
    };
  }
}
