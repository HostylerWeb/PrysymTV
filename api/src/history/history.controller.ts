import {
  Body,
  Controller,
  Delete,
  Get,
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
    const [items, total] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.watchHistory.count({ where: { userId: user.id } }),
    ]);
    return { items, meta: { page: p, limit: l, total } };
  }

  @Post('progress')
  async progress(
    @CurrentUser() user: AuthUserPayload,
    @Body()
    body: {
      contentType: 'video' | 'podcast_episode';
      contentId: string;
      progressSeconds: number;
      completed?: boolean;
    },
  ) {
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
    @Param('contentType') contentType: 'video' | 'podcast_episode',
    @Param('contentId') contentId: string,
  ) {
    await this.prisma.watchHistory.deleteMany({
      where: { userId: user.id, contentType, contentId },
    });
    return { success: true };
  }
}
