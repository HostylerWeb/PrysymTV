import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportReason, ReportTargetType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, dto: CreateReportDto) {
    await this.assertTargetExists(dto.targetType, dto.targetId);

    const reason = Object.values(ReportReason).includes(dto.reason)
      ? dto.reason
      : ReportReason.other;

    await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason,
        description: dto.details?.trim() || null,
      },
    });

    return { success: true };
  }

  private async assertTargetExists(
    targetType: ReportTargetType,
    targetId: string,
  ) {
    switch (targetType) {
      case ReportTargetType.video: {
        const video = await this.prisma.video.findUnique({
          where: { id: targetId },
        });
        if (!video) throw new NotFoundException('Video not found');
        return;
      }
      case ReportTargetType.stream: {
        const stream = await this.prisma.stream.findUnique({
          where: { id: targetId },
        });
        if (!stream) throw new NotFoundException('Stream not found');
        return;
      }
      case ReportTargetType.user: {
        const user = await this.prisma.user.findUnique({
          where: { id: targetId },
        });
        if (!user) throw new NotFoundException('User not found');
        if (user.isBanned) {
          throw new BadRequestException('Cannot report this user');
        }
        return;
      }
      case ReportTargetType.comment: {
        const comment = await this.prisma.comment.findUnique({
          where: { id: targetId },
        });
        if (!comment) throw new NotFoundException('Comment not found');
        return;
      }
      case ReportTargetType.podcast_episode: {
        const episode = await this.prisma.podcastEpisode.findUnique({
          where: { id: targetId },
        });
        if (!episode) throw new NotFoundException('Podcast episode not found');
        return;
      }
      case ReportTargetType.vertical_episode: {
        const episode = await this.prisma.verticalEpisode.findUnique({
          where: { id: targetId },
        });
        if (!episode) throw new NotFoundException('Vertical episode not found');
        return;
      }
      default:
        throw new BadRequestException('Invalid report target');
    }
  }
}
