import { Injectable } from '@nestjs/common';
import { ContentStatus, StreamStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, type?: string, page = 1, limit = 20) {
    const query = q.trim();
    if (!query) {
      return { query: '', videos: [], creators: [], podcasts: [], streams: [] };
    }

    const skip = (page - 1) * limit;
    const contains = { contains: query, mode: 'insensitive' as const };

    const [videos, creators, podcasts, streams] = await Promise.all([
      type && type !== 'video'
        ? []
        : this.prisma.video.findMany({
            where: {
              status: ContentStatus.ready,
              OR: [{ title: contains }, { description: contains }],
            },
            take: limit,
            skip,
            select: { id: true, title: true, thumbnailUrl: true, type: true, viewsCount: true },
          }),
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
      type && type !== 'podcast'
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
    ]);

    return { query, videos, creators, podcasts, streams };
  }

  async suggest(q: string) {
    const query = q.trim();
    if (!query) return { query: '', suggestions: [] };

    const contains = { contains: query, mode: 'insensitive' as const };
    const [users, videos] = await Promise.all([
      this.prisma.user.findMany({
        where: { username: contains },
        take: 5,
        select: { username: true, displayName: true },
      }),
      this.prisma.video.findMany({
        where: { title: contains, status: ContentStatus.ready },
        take: 5,
        select: { id: true, title: true },
      }),
    ]);

    const suggestions = [
      ...users.map((u) => ({ type: 'creator' as const, label: u.displayName ?? u.username, href: `/creator/${u.username}` })),
      ...videos.map((v) => ({ type: 'video' as const, label: v.title, href: `/watch/${v.id}` })),
    ];

    return { query, suggestions };
  }
}
