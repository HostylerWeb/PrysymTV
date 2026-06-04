import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PrismaService } from '../prisma/prisma.service';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const skip = (p - 1) * l;
    const [rows, total] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.watchHistory.count({ where: { userId: user.id } }),
    ]);
    const videoIds = rows
      .filter((r) => r.contentType === 'video')
      .map((r) => r.contentId);
    const podcastIds = rows
      .filter((r) => r.contentType === 'podcast_episode')
      .map((r) => r.contentId);
    const verticalIds = rows
      .filter((r) => r.contentType === 'vertical_episode')
      .map((r) => r.contentId);
    const [videos, podcastEpisodes, verticalEpisodes] = await Promise.all([
      videoIds.length > 0
        ? this.prisma.video.findMany({
            where: { id: { in: videoIds } },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              durationSeconds: true,
              type: true,
              viewsCount: true,
              creator: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          })
        : [],
      podcastIds.length > 0
        ? this.prisma.podcastEpisode.findMany({
            where: { id: { in: podcastIds } },
            include: { show: { select: { title: true } } },
          })
        : [],
      verticalIds.length > 0
        ? this.prisma.verticalEpisode.findMany({
            where: { id: { in: verticalIds } },
            include: {
              series: {
                select: {
                  slug: true,
                  title: true,
                  posterUrl: true,
                },
              },
            },
          })
        : [],
    ]);
    const videoById = new Map(videos.map((v) => [v.id, v]));
    const podcastById = new Map(podcastEpisodes.map((e) => [e.id, e]));
    const verticalById = new Map(verticalEpisodes.map((e) => [e.id, e]));
    const items = rows.map((r) => ({
      contentType: r.contentType,
      contentId: r.contentId,
      progressSeconds: r.progressSeconds,
      completed: r.completed,
      updatedAt: r.updatedAt,
      video:
        r.contentType === 'video' ? (videoById.get(r.contentId) ?? null) : null,
      podcastEpisode:
        r.contentType === 'podcast_episode'
          ? (podcastById.get(r.contentId) ?? null)
          : null,
      verticalEpisode:
        r.contentType === 'vertical_episode'
          ? (verticalById.get(r.contentId) ?? null)
          : null,
    }));
    return { items, meta: { page: p, limit: l, total } };
  }

  @Post('progress')
  async progress(
    @CurrentUser() user: AuthUserPayload,
    @Body()
    body: {
      contentType: 'video' | 'podcast_episode' | 'vertical_episode';
      contentId: string;
      progressSeconds: number;
      completed?: boolean;
    },
  ) {
    if (body.contentType === 'vertical_episode') {
      const ep = await this.prisma.verticalEpisode.findUnique({
        where: { id: body.contentId },
      });
      if (!ep) throw new NotFoundException('Vertical episode not found');
    }

    return this.prisma.watchHistory.upsert({
      where: {
        userId_contentType_contentId: {
          userId: user.id,
          contentType: body.contentType,
          contentId: body.contentId,
        },
      },
      create: {
        userId: user.id,
        contentType: body.contentType,
        contentId: body.contentId,
        progressSeconds: body.progressSeconds,
        completed: body.completed ?? false,
      },
      update: {
        progressSeconds: body.progressSeconds,
        completed: body.completed ?? false,
      },
    });
  }

  @Delete('clear')
  async clear(@CurrentUser() user: AuthUserPayload) {
    await this.prisma.watchHistory.deleteMany({ where: { userId: user.id } });
    return { success: true };
  }

  @Delete(':contentType/:contentId')
  async remove(
    @CurrentUser() user: AuthUserPayload,
    @Param('contentType') contentType: 'video' | 'podcast_episode' | 'vertical_episode',
    @Param('contentId') contentId: string,
  ) {
    await this.prisma.watchHistory.deleteMany({
      where: { userId: user.id, contentType, contentId },
    });
    return { success: true };
  }
}
