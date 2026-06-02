import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PodcastsService {
  constructor(private readonly prisma: PrismaService) {}

  async listShows(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.podcastShow.findMany({
        where: { visibility: 'public' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { creator: { select: { username: true, displayName: true } } },
      }),
      this.prisma.podcastShow.count(),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async episodesFeed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.podcastEpisode.findMany({
        where: { status: ContentStatus.ready, visibility: 'public' },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          show: { select: { id: true, title: true, coverUrl: true } },
          creator: { select: { username: true, displayName: true } },
        },
      }),
      this.prisma.podcastEpisode.count({
        where: { status: ContentStatus.ready },
      }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async getEpisode(id: string) {
    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id },
      include: {
        show: true,
        creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    return episode;
  }
}
