import { Injectable, NotFoundException } from '@nestjs/common';
import { VerticalSeriesStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VerticalsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSeries() {
    const items = await this.prisma.verticalSeries.findMany({
      where: { status: VerticalSeriesStatus.published, visibility: 'public' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        posterUrl: true,
        genre: true,
        totalEpisodes: true,
      },
    });
    return { items };
  }

  async getSeries(slug: string) {
    const series = await this.prisma.verticalSeries.findFirst({
      where: { slug, status: VerticalSeriesStatus.published },
      include: {
        episodes: {
          where: { status: 'ready' },
          orderBy: { episodeNumber: 'asc' },
          select: {
            id: true,
            episodeNumber: true,
            title: true,
            thumbnailUrl: true,
            durationSeconds: true,
            cliffhanger: true,
          },
        },
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
    if (!series) throw new NotFoundException('Series not found');
    return series;
  }

  async getEpisode(slug: string, episodeNumber: number) {
    const series = await this.prisma.verticalSeries.findFirst({
      where: { slug, status: VerticalSeriesStatus.published },
      select: { id: true, slug: true, title: true, creatorId: true },
    });
    if (!series) throw new NotFoundException('Series not found');

    const episode = await this.prisma.verticalEpisode.findFirst({
      where: {
        seriesId: series.id,
        episodeNumber,
        status: 'ready',
      },
    });
    if (!episode) throw new NotFoundException('Episode not found');

    const next = await this.prisma.verticalEpisode.findFirst({
      where: {
        seriesId: series.id,
        episodeNumber: episodeNumber + 1,
        status: 'ready',
      },
      select: { episodeNumber: true, title: true },
    });

    return {
      series: { id: series.id, slug: series.slug, title: series.title, creatorId: series.creatorId },
      episode,
      nextEpisode: next,
    };
  }
}
