import { Injectable } from '@nestjs/common';
import { ContentStatus, StreamStatus, VideoType } from '@prisma/client';
import { ContentServicesService } from '../content-services/content-services.service';
import { contentServiceForVideoType } from '../content-services/content-services.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentServices: ContentServicesService,
  ) {}

  private videoTypeForScope(type?: string): VideoType | null | undefined {
    if (!type || type === 'all') return undefined;
    if (type === 'short') return VideoType.short;
    if (type === 'video') return VideoType.video;
    if (type === 'movie') return VideoType.movie;
    if (type === 'series_episode') return VideoType.series_episode;
    return null;
  }

  private includesVideos(type?: string): boolean {
    if (!type) return true;
    return ['short', 'video', 'movie', 'series_episode'].includes(type);
  }

  async search(q: string, type?: string, page = 1, limit = 20) {
    const query = q.trim();
    if (!query) {
      return { query: '', videos: [], creators: [], podcasts: [], streams: [], verticals: [] };
    }

    const services = await this.contentServices.get();
    const skip = (page - 1) * limit;
    const contains = { contains: query, mode: 'insensitive' as const };
    const videoType = this.videoTypeForScope(type);
    const podcastsEnabled = services.podcasts;
    const verticalsEnabled = services.verticals;

    const [videos, creators, podcasts, streams, verticals] = await Promise.all([
      !this.includesVideos(type) || videoType === null
        ? []
        : this.prisma.video.findMany({
            where: {
              status: ContentStatus.ready,
              ...(videoType ? { type: videoType } : {}),
              OR: [{ title: contains }, { description: contains }],
            },
            take: limit,
            skip,
            select: { id: true, title: true, thumbnailUrl: true, type: true, viewsCount: true },
          }).then((rows) =>
            rows.filter((row) => services[contentServiceForVideoType(row.type)]),
          ),
      type && type !== 'creator'
        ? []
        : this.prisma.user.findMany({
            where: {
              OR: [
                { username: contains },
                { displayName: contains },
                { bio: contains },
              ],
            },
            take: limit,
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          }),
      type && type !== 'podcast' || !podcastsEnabled
        ? []
        : this.prisma.podcastShow.findMany({
            where: { OR: [{ title: contains }, { description: contains }] },
            take: limit,
            skip,
            select: { id: true, title: true, coverUrl: true, category: true },
          }),
      type && type !== 'stream'
        ? []
        : this.prisma.stream.findMany({
            where: {
              status: StreamStatus.live,
              OR: [{ title: contains }, { category: contains }],
            },
            take: limit,
            include: { creator: { select: { username: true, displayName: true } } },
          }),
      type && type !== 'vertical' || !verticalsEnabled
        ? []
        : this.prisma.verticalSeries.findMany({
            where: {
              OR: [{ title: contains }, { tagline: contains }, { description: contains }],
            },
            take: limit,
            skip,
            select: {
              id: true,
              slug: true,
              title: true,
              posterUrl: true,
              tagline: true,
              _count: {
                select: {
                  episodes: { where: { status: ContentStatus.ready } },
                },
              },
            },
          }),
    ]);

    const verticalHits = verticals.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      posterUrl: row.posterUrl,
      tagline: row.tagline,
      totalEpisodes: row._count.episodes,
    }));

    return { query, videos, creators, podcasts, streams, verticals: verticalHits };
  }

  async suggest(q: string, type?: string) {
    const query = q.trim();
    if (!query) return { query: '', suggestions: [] };

    const contains = { contains: query, mode: 'insensitive' as const };
    const videoType = this.videoTypeForScope(type);

    if (type === 'vertical') {
      const series = await this.prisma.verticalSeries.findMany({
        where: { title: contains },
        take: 5,
        select: { slug: true, title: true },
      });
      return {
        query,
        suggestions: series.map((s) => ({
          type: 'vertical' as const,
          label: s.title,
          href: `/verticals/${s.slug}`,
        })),
      };
    }

    if (type === 'podcast') {
      const shows = await this.prisma.podcastShow.findMany({
        where: { title: contains },
        take: 5,
        select: { id: true, title: true },
      });
      return {
        query,
        suggestions: shows.map((p) => ({
          type: 'podcast' as const,
          label: p.title,
          href: '/podcasts',
        })),
      };
    }

    if (type === 'short' || type === 'video' || type === 'movie') {
      const videos = await this.prisma.video.findMany({
        where: {
          title: contains,
          status: ContentStatus.ready,
          ...(videoType ? { type: videoType } : {}),
        },
        take: 5,
        select: { id: true, title: true, type: true },
      });
      return {
        query,
        suggestions: videos.map((v) => ({
          type: v.type,
          label: v.title,
          href:
            v.type === 'short'
              ? '/shorts'
              : v.type === 'movie'
                ? `/movie/${v.id}`
                : `/watch/${v.id}`,
        })),
      };
    }

    const [users, videos] = await Promise.all([
      this.prisma.user.findMany({
        where: { username: contains },
        take: 5,
        select: { username: true, displayName: true },
      }),
      this.prisma.video.findMany({
        where: { title: contains, status: ContentStatus.ready },
        take: 5,
        select: { id: true, title: true, type: true },
      }),
    ]);

    const suggestions = [
      ...users.map((u) => ({
        type: 'creator' as const,
        label: u.displayName ?? u.username,
        href: `/creator/${u.username}`,
      })),
      ...videos.map((v) => ({
        type: v.type,
        label: v.title,
        href:
          v.type === 'short'
            ? '/shorts'
            : v.type === 'movie'
              ? `/movie/${v.id}`
              : `/watch/${v.id}`,
      })),
    ];

    return { query, suggestions };
  }
}
