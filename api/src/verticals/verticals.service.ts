import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, VerticalSeriesStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttachEpisodeVideoDto } from './dto/attach-episode-video.dto';
import { CreateVerticalEpisodeDto } from './dto/create-vertical-episode.dto';
import { CreateVerticalSeriesDto } from './dto/create-vertical-series.dto';

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

  async createSeries(creatorId: string, dto: CreateVerticalSeriesDto) {
    const exists = await this.prisma.verticalSeries.findUnique({
      where: { slug: dto.slug },
    });
    if (exists) throw new ConflictException('Slug already in use');

    return this.prisma.verticalSeries.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        tagline: dto.tagline,
        description: dto.description,
        genre: dto.genre,
        posterUrl: dto.posterUrl,
        bannerUrl: dto.bannerUrl,
        creatorId,
        status: VerticalSeriesStatus.published,
        totalEpisodes: 0,
      },
    });
  }

  async createEpisode(creatorId: string, slug: string, dto: CreateVerticalEpisodeDto) {
    const series = await this.prisma.verticalSeries.findFirst({ where: { slug } });
    if (!series) throw new NotFoundException('Series not found');
    if (series.creatorId && series.creatorId !== creatorId) {
      throw new ForbiddenException('Not your series');
    }

    const episode = await this.prisma.verticalEpisode.create({
      data: {
        seriesId: series.id,
        episodeNumber: dto.episodeNumber,
        title: dto.title,
        description: dto.description,
        cliffhanger: dto.cliffhanger,
        durationSeconds: dto.durationSeconds ?? 120,
        status: ContentStatus.processing,
      },
    });

    const count = await this.prisma.verticalEpisode.count({
      where: { seriesId: series.id },
    });
    await this.prisma.verticalSeries.update({
      where: { id: series.id },
      data: { totalEpisodes: count, creatorId: series.creatorId ?? creatorId },
    });

    return episode;
  }

  async attachEpisodeVideo(
    creatorId: string,
    episodeId: string,
    dto: AttachEpisodeVideoDto,
  ) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id: episodeId },
      include: { series: true },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    if (episode.series.creatorId && episode.series.creatorId !== creatorId) {
      throw new ForbiddenException('Not your episode');
    }

    const video = await this.prisma.video.findUnique({ where: { id: dto.videoId } });
    if (!video || video.creatorId !== creatorId) {
      throw new ForbiddenException('Invalid video');
    }

    return this.prisma.verticalEpisode.update({
      where: { id: episodeId },
      data: {
        videoUrl: video.hlsMasterUrl,
        thumbnailUrl: video.thumbnailUrl ?? episode.thumbnailUrl,
        status: video.status === ContentStatus.ready ? ContentStatus.ready : ContentStatus.processing,
      },
    });
  }

  async listMySeries(creatorId: string) {
    const items = await this.prisma.verticalSeries.findMany({
      where: { creatorId },
      orderBy: { updatedAt: 'desc' },
      include: {
        episodes: { orderBy: { episodeNumber: 'asc' } },
      },
    });
    return { items };
  }
}
