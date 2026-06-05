import { Injectable, NotFoundException } from '@nestjs/common';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import type { ProgramConfigEntry } from '../platform-settings/platform-settings.types';
import { PrismaService } from '../prisma/prisma.service';
import { programBySlug } from './programs.constants';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  async list() {
    const items = await this.platformSettings.getPrograms();
    return {
      items: items
        .filter((p) => p.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ slug, vertical, label, description, href }) => ({
          slug,
          vertical,
          label,
          description,
          href,
        })),
    };
  }

  async getHub(slug: string) {
    const programs = await this.platformSettings.getPrograms();
    const meta = programs.find((p) => p.slug === slug && p.isActive);
    if (!meta) {
      const fallback = programBySlug(slug);
      if (!fallback) throw new NotFoundException('Unknown program');
      return this.loadHub({
        ...fallback,
        isActive: true,
        sortOrder: 0,
      });
    }
    return this.loadHub(meta);
  }

  private async loadHub(meta: ProgramConfigEntry) {
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
