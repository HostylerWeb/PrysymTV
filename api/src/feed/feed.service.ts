import { Injectable } from '@nestjs/common';
import { ContentStatus, StreamStatus, VideoType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapVideoCard, VIDEO_CARD_SELECT } from '../common/mappers/content.mapper';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async home() {
    const [liveStreams, movies, videos, featuredMovie] = await Promise.all([
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
      continueWatching: [],
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

  async trending(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
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
