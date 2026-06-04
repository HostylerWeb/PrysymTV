import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  LikeTargetType,
  ReportReason,
  ReportTargetType,
  SavedItemType,
  VideoType,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { VIDEO_PROCESSING_QUEUE } from '../queue/queue.constants';
import type { VideoProcessingJobData } from '../queue/video-processing.processor';
import { mapVideoCard, VIDEO_CARD_SELECT } from '../common/mappers/content.mapper';
import { UploadCompleteDto } from './dto/upload-complete.dto';
import { UploadInitDto } from './dto/upload-init.dto';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue(VIDEO_PROCESSING_QUEUE) private readonly videoQueue: Queue,
  ) {}

  private mapUploadType(type: UploadInitDto['type']): VideoType {
    if (type === 'podcast') return VideoType.video;
    return type as VideoType;
  }

  async uploadInit(userId: string, dto: UploadInitDto) {
    const maxBytes = this.storage.getSettings().maxUploadBytes;
    const video = await this.prisma.video.create({
      data: {
        creatorId: userId,
        type: this.mapUploadType(dto.type),
        title: dto.title.trim(),
        description: dto.description?.trim(),
        category: dto.type === 'podcast' ? 'podcast' : undefined,
        status: ContentStatus.processing,
      },
    });

    const target = await this.storage.createUploadTarget(
      video.id,
      dto.mimeType,
      dto.fileName,
    );

    await this.prisma.video.update({
      where: { id: video.id },
      data: { rawObjectKey: target.objectKey },
    });

    return {
      videoId: video.id,
      status: video.status,
      objectKey: target.objectKey,
      uploadUrl: target.uploadUrl,
      uploadMethod: target.uploadMethod,
      uploadHeaders: target.uploadHeaders,
      maxUploadBytes: maxBytes,
      expiresIn: target.expiresIn,
    };
  }

  async uploadComplete(userId: string, dto: UploadCompleteDto) {
    const video = await this.prisma.video.findUnique({
      where: { id: dto.videoId },
    });
    if (!video) throw new NotFoundException('Video not found');
    if (video.creatorId !== userId) {
      throw new ForbiddenException('Not your upload');
    }

    const objectKey =
      dto.objectKey ??
      video.rawObjectKey ??
      this.storage.buildRawKey(dto.videoId);

    const exists = await this.storage.objectExists(objectKey);
    if (!exists) {
      throw new BadRequestException(
        'Upload not found in storage. Finish the file upload before calling complete.',
      );
    }

    const size = await this.storage.getObjectSize(objectKey);
    if (size <= 0) {
      throw new BadRequestException('Uploaded file is empty');
    }
    if (size > this.storage.getSettings().maxUploadBytes) {
      throw new BadRequestException('File exceeds maximum upload size');
    }

    const jobData: VideoProcessingJobData = {
      videoId: dto.videoId,
      objectKey,
    };
    await this.videoQueue.add('process', jobData, {
      jobId: `video-${dto.videoId}`,
    });

    return {
      videoId: dto.videoId,
      status: ContentStatus.processing,
      message: 'Upload received; processing started',
    };
  }

  async getOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
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
    });
    if (!video) throw new NotFoundException('Video not found');
    return this.toPublicVideo(video);
  }

  toPublicVideo(
    video: {
      id: string;
      title: string;
      description: string | null;
      thumbnailUrl: string | null;
      hlsMasterUrl: string | null;
      durationSeconds: number;
      viewsCount: number;
      likesCount: number;
      commentsCount: number;
      type: string;
      status: string;
      category: string | null;
      releaseYear: number | null;
      ageRating: string | null;
      tagline: string | null;
      creator: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
      };
    },
  ) {
    return {
      ...video,
      playbackUrl: video.hlsMasterUrl,
      videoUrl: video.hlsMasterUrl,
    };
  }

  async listComments(videoId: string, page = 1, limit = 30) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { videoId, parentId: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          replies: {
            take: 5,
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { videoId, parentId: null } }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async createComment(
    userId: string,
    videoId: string,
    body: string,
    parentId?: string,
  ) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { userId, videoId, body, parentId },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      });
      await tx.video.update({
        where: { id: videoId },
        data: { commentsCount: { increment: 1 } },
      });
      return created;
    });

    return comment;
  }

  async shortsFeed(cursor?: string, limit = 20) {
    const skip = cursor ? parseInt(cursor, 10) || 0 : 0;
    const items = await this.prisma.video.findMany({
      where: { type: VideoType.short, status: ContentStatus.ready, visibility: 'public' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit + 1,
      select: VIDEO_CARD_SELECT,
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page.map(mapVideoCard),
      nextCursor: hasMore ? String(skip + limit) : null,
    };
  }

  async moviesFeed(page = 1, limit = 24) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { type: VideoType.movie, status: ContentStatus.ready, visibility: 'public' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: VIDEO_CARD_SELECT,
      }),
      this.prisma.video.count({
        where: { type: VideoType.movie, status: ContentStatus.ready },
      }),
    ]);
    return { items: items.map(mapVideoCard), meta: { page, limit, total } };
  }

  async featuredMovie() {
    const item = await this.prisma.video.findFirst({
      where: { type: VideoType.movie, status: ContentStatus.ready },
      orderBy: { viewsCount: 'desc' },
      select: VIDEO_CARD_SELECT,
    });
    return { item: item ? mapVideoCard(item) : null };
  }

  async toggleLike(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: LikeTargetType.video,
          targetId: videoId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: LikeTargetType.video,
              targetId: videoId,
            },
          },
        });
        await tx.video.update({
          where: { id: videoId },
          data: { likesCount: { decrement: 1 } },
        });
      });
      return { liked: false };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: { userId, targetType: LikeTargetType.video, targetId: videoId },
      });
      await tx.video.update({
        where: { id: videoId },
        data: { likesCount: { increment: 1 } },
      });
    });
    return { liked: true };
  }

  async toggleSave(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const itemType =
      video.type === VideoType.movie ? SavedItemType.movie : SavedItemType.video;

    const existing = await this.prisma.savedItem.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId: videoId } },
    });

    if (existing) {
      await this.prisma.savedItem.delete({
        where: { userId_itemType_itemId: existing },
      });
      return { saved: false };
    }

    await this.prisma.savedItem.create({
      data: { userId, itemType, itemId: videoId },
    });
    return { saved: true };
  }

  async report(
    userId: string,
    videoId: string,
    body: { reason?: string; details?: string },
  ) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const reason =
      body.reason && Object.values(ReportReason).includes(body.reason as ReportReason)
        ? (body.reason as ReportReason)
        : ReportReason.other;

    await this.prisma.report.create({
      data: {
        reporterId: userId,
        targetType: ReportTargetType.video,
        targetId: videoId,
        reason,
        description: body.details,
      },
    });
    return { success: true };
  }
}
