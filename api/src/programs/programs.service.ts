import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLATFORM_PROGRAMS, programBySlug } from './programs.constants';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return { items: PLATFORM_PROGRAMS };
  }

  async getHub(slug: string) {
    const meta = programBySlug(slug);
    if (!meta) throw new NotFoundException('Unknown program');

    const [videos, liveEvents] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          status: 'ready',
          OR: [{ vertical: meta.vertical }, { category: meta.slug }],
        },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          viewsCount: true,
          type: true,
          vertical: true,
        },
      }),
      this.prisma.liveEvent.findMany({
        where: { vertical: meta.vertical, status: { in: ['scheduled', 'live'] } },
        orderBy: { startsAt: 'asc' },
        take: 12,
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          eventType: true,
          startsAt: true,
          status: true,
        },
      }),
    ]);

    return { ...meta, videos, liveEvents };
  }
}
