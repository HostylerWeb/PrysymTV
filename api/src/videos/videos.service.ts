import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  ContentVertical,
  Visibility,
  DislikeTargetType,
  LikeTargetType,
  Prisma,
  ReportReason,
  ReportTargetType,
  SavedItemType,
  StreamStatus,
  VideoType,
} from '@prisma/client';
import {
  enrichCreatorFollowForViewer,
  enrichVideoCardsForViewer,
  getLikedCommentIds,
  getViewerVideoFlags,
  savedItemTypeForVideo,
} from '../common/engagement.util';
import { Queue } from 'bullmq';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { StreamsService } from '../streams/streams.service';
import { VIDEO_PROCESSING_QUEUE } from '../queue/queue.constants';
import type { VideoProcessingJobData } from '../queue/video-processing.processor';
import { mapVideoCard, VIDEO_CARD_SELECT } from '../common/mappers/content.mapper';
import { verticalFromCategorySlug, categorySlugsForVertical } from '../common/utils/category-vertical.util';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { UploadCompleteDto } from './dto/upload-complete.dto';
import { UploadInitDto } from './dto/upload-init.dto';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly analytics: AnalyticsService,
    private readonly notifications: NotificationsService,
    private readonly streams: StreamsService,
    @InjectQueue(VIDEO_PROCESSING_QUEUE) private readonly videoQueue: Queue,
  ) {}

  private mapUploadType(type: UploadInitDto['type']): VideoType {
    if (type === 'podcast') return VideoType.video;
    return type as VideoType;
  }

  async uploadInit(user: AuthUserPayload, dto: UploadInitDto) {
    if (dto.type === 'movie' && user.role !== 'admin') {
      throw new ForbiddenException(
        'Movies can only be uploaded by platform admins',
      );
    }

    const maxBytes = this.storage.getSettings().maxUploadBytes;
    const tags =
      dto.tags
        ?.split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20) ?? [];

    const visibility =
      dto.visibility && Object.values(Visibility).includes(dto.visibility as Visibility)
        ? (dto.visibility as Visibility)
        : Visibility.public;

    const writers =
      dto.type === 'movie' && dto.writers
        ? dto.writers
            .split(',')
            .map((w) => w.trim())
            .filter(Boolean)
            .slice(0, 12)
        : [];

    const categorySlug =
      dto.category?.trim() ||
      (dto.type === 'movie'
        ? 'drama'
        : dto.type === 'podcast'
          ? 'podcast'
          : undefined);

    const video = await this.prisma.video.create({
      data: {
        creatorId: user.id,
        type: this.mapUploadType(dto.type),
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        category: categorySlug,
        vertical: verticalFromCategorySlug(categorySlug),
        verticalEpisodeId: dto.verticalEpisodeId?.trim() || null,
        releaseYear: dto.type === 'movie' ? (dto.releaseYear ?? null) : undefined,
        ageRating:
          dto.type === 'movie' ? dto.ageRating?.trim() || null : undefined,
        tagline:
          dto.type === 'movie' ? dto.tagline?.trim() || null : undefined,
        director:
          dto.type === 'movie' ? dto.director?.trim() || null : undefined,
        writers: dto.type === 'movie' ? writers : [],
        tags,
        visibility,
        status: ContentStatus.processing,
        cast:
          dto.type === 'movie' && dto.cast?.length
            ? {
                create: dto.cast.slice(0, 20).map((member, index) => ({
                  name: member.name.trim(),
                  role: member.role.trim(),
                  sortOrder: index,
                })),
              }
            : undefined,
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

  async updateOwned(
    userId: string,
    id: string,
    body: { title?: string; description?: string },
  ) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');
    if (video.creatorId !== userId) {
      throw new ForbiddenException('You can only edit your own uploads');
    }

    return this.prisma.video.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description.trim() || null }
          : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
      },
    });
  }

  async getOne(id: string, viewerId?: string) {
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
        cast: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!video) throw new NotFoundException('Video not found');

    const flags = await getViewerVideoFlags(
      this.prisma,
      viewerId,
      video.id,
      video.type,
    );

    let isFollowing = false;
    if (viewerId && viewerId !== video.creatorId) {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: video.creatorId,
          },
        },
      });
      isFollowing = !!follow;
    }

    const { cast, ...rest } = video;
    return {
      ...this.toPublicVideo(rest),
      ...flags,
      isFollowing,
      dislikesCount: video.dislikesCount,
      director: video.director,
      writers: video.writers,
      cast: cast.map((m) => ({
        name: m.name,
        role: m.role,
        imageUrl: m.imageUrl,
      })),
    };
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
      dislikesCount: number;
      commentsCount: number;
      type: string;
      status: string;
      category: string | null;
      releaseYear: number | null;
      ageRating: string | null;
      tagline: string | null;
      director?: string | null;
      writers?: string[];
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

  async listComments(videoId: string, page = 1, limit = 30, viewerId?: string) {
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

    const commentIds = items.flatMap((c) => [
      c.id,
      ...c.replies.map((r) => r.id),
    ]);
    const likedIds = await getLikedCommentIds(this.prisma, viewerId, commentIds);

    const mapComment = (c: (typeof items)[0] | (typeof items)[0]['replies'][0]) => ({
      ...c,
      liked: likedIds.has(c.id),
    });

    return {
      items: items.map((c) => ({
        ...mapComment(c),
        replies: c.replies.map((r) => mapComment(r)),
      })),
      meta: { page, limit, total },
    };
  }

  async createComment(
    userId: string,
    videoId: string,
    body: string,
    parentId?: string,
  ) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const parent = parentId
      ? await this.prisma.comment.findUnique({
          where: { id: parentId },
          select: { userId: true },
        })
      : null;

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

    if (parent) {
      void this.notifications.notifyCommentReply(
        parent.userId,
        userId,
        videoId,
        comment.id,
        video.type,
      );
    } else {
      void this.notifications.notifyCommentOnVideo(
        video.creatorId,
        userId,
        videoId,
        comment.id,
        video.type,
      );
    }

    return comment;
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { replies: { select: { id: true } } },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const idsToDelete = comment.parentId
      ? [commentId]
      : [commentId, ...comment.replies.map((r) => r.id)];

    await this.prisma.$transaction(async (tx) => {
      await tx.like.deleteMany({
        where: {
          targetType: LikeTargetType.comment,
          targetId: { in: idsToDelete },
        },
      });
      await tx.comment.deleteMany({
        where: { id: { in: idsToDelete } },
      });
      await tx.video.update({
        where: { id: comment.videoId },
        data: { commentsCount: { decrement: idsToDelete.length } },
      });
    });

    return { success: true, deletedIds: idsToDelete };
  }

  async shortsFeed(cursor?: string, limit = 20, viewerId?: string) {
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
    const typesById = new Map(page.map((v) => [v.id, v.type]));
    const [flags, followByCreator] = await Promise.all([
      enrichVideoCardsForViewer(
        this.prisma,
        viewerId,
        page.map((v) => v.id),
        typesById,
      ),
      enrichCreatorFollowForViewer(
        this.prisma,
        viewerId,
        page.map((v) => v.creator.id),
      ),
    ]);

    return {
      items: page.map((v) => {
        const card = mapVideoCard(v);
        const f = flags.get(v.id) ?? { liked: false, saved: false, disliked: false };
        return {
          ...card,
          ...f,
          isFollowing: followByCreator.get(v.creator.id) ?? false,
        };
      }),
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

  async videosBrowseFeed(params: {
    page?: number;
    limit?: number;
    vertical?: string;
    sort?: string;
    mode?: string;
    q?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(1, params.limit ?? 24), 48);
    const mode = params.mode === 'live' || params.mode === 'videos' ? params.mode : 'all';
    const sort = params.sort === 'newest' ? 'newest' : 'views';
    const orderBy =
      sort === 'newest'
        ? ({ createdAt: 'desc' } as const)
        : ({ viewsCount: 'desc' } as const);

    const videoWhere: Prisma.VideoWhereInput = {
      type: VideoType.video,
      status: ContentStatus.ready,
      visibility: 'public',
    };

    const vertical = params.vertical?.trim();
    if (vertical && vertical !== 'all') {
      const allowed = Object.values(ContentVertical);
      if (allowed.includes(vertical as ContentVertical)) {
        const v = vertical as ContentVertical;
        const slugs = categorySlugsForVertical(v);
        videoWhere.OR = [
          { vertical: v },
          ...(slugs.length
            ? [{ vertical: null, category: { in: slugs } }]
            : []),
        ];
      }
    }

    const q = params.q?.trim();
    if (q) {
      videoWhere.title = { contains: q, mode: 'insensitive' };
    }

    const streamWhere: Prisma.StreamWhereInput = {
      status: StreamStatus.live,
    };
    if (vertical && vertical !== 'all') {
      const allowed = Object.values(ContentVertical);
      if (allowed.includes(vertical as ContentVertical)) {
        const v = vertical as ContentVertical;
        const slugs = categorySlugsForVertical(v);
        streamWhere.OR = [
          { vertical: v },
          ...(slugs.length
            ? [{ vertical: null, category: { in: slugs } }]
            : []),
        ];
      }
    }

    const emptyVideos = {
      items: [] as ReturnType<typeof mapVideoCard>[],
      meta: { page, limit, total: 0 },
    };
    const emptyLive = { items: [] as Array<Record<string, unknown>> };

    if (mode === 'live' || mode === 'all') {
      await this.streams.syncStreamsFromIngest();
    }

    if (mode === 'live') {
      const streams = await this.prisma.stream.findMany({
        where: streamWhere,
        orderBy: { viewerCount: 'desc' },
        take: limit,
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
      return {
        videos: emptyVideos,
        live: { items: streams.map((s) => this.mapLiveBrowseItem(s)) },
      };
    }

    if (mode === 'videos') {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        this.prisma.video.findMany({
          where: videoWhere,
          orderBy,
          skip,
          take: limit,
          select: VIDEO_CARD_SELECT,
        }),
        this.prisma.video.count({ where: videoWhere }),
      ]);
      return {
        videos: {
          items: items.map(mapVideoCard),
          meta: { page, limit, total },
        },
        live: emptyLive,
      };
    }

    const skip = (page - 1) * limit;
    const [videoItems, videoTotal, streams] = await Promise.all([
      this.prisma.video.findMany({
        where: videoWhere,
        orderBy,
        skip,
        take: limit,
        select: VIDEO_CARD_SELECT,
      }),
      this.prisma.video.count({ where: videoWhere }),
      this.prisma.stream.findMany({
        where: streamWhere,
        orderBy: { viewerCount: 'desc' },
        take: 12,
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
      }),
    ]);

    return {
      videos: {
        items: videoItems.map(mapVideoCard),
        meta: { page, limit, total: videoTotal },
      },
      live: { items: streams.map((s) => this.mapLiveBrowseItem(s)) },
    };
  }

  private mapLiveBrowseItem(s: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    hlsPlaybackUrl: string | null;
    viewerCount: number;
    category: string | null;
    vertical: ContentVertical | null;
    creator: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  }) {
    return {
      contentType: 'live' as const,
      id: s.id,
      slug: s.creator.username,
      title: s.title,
      thumbnailUrl: s.thumbnailUrl ?? s.creator.avatarUrl,
      hlsPlaybackUrl: s.hlsPlaybackUrl,
      viewerCount: s.viewerCount,
      category: s.category,
      vertical: s.vertical,
      streamer: s.creator.displayName ?? s.creator.username,
      streamerSlug: s.creator.username,
      streamerAvatar: s.creator.avatarUrl,
      creatorId: s.creator.id,
    };
  }

  async recordView(
    videoId: string,
    userId?: string,
    countryCode?: string,
  ) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video || video.status !== ContentStatus.ready) {
      throw new NotFoundException('Video not found');
    }
    await this.prisma.video.update({
      where: { id: videoId },
      data: { viewsCount: { increment: 1 } },
    });
    await this.analytics.recordViewEvent({
      videoId,
      creatorId: video.creatorId,
      userId,
      countryCode,
    });
    return { success: true, viewsCount: video.viewsCount + 1 };
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
      const dislike = await tx.dislike.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: DislikeTargetType.video,
            targetId: videoId,
          },
        },
      });
      if (dislike) {
        await tx.dislike.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: DislikeTargetType.video,
              targetId: videoId,
            },
          },
        });
        await tx.video.update({
          where: { id: videoId },
          data: { dislikesCount: { decrement: 1 } },
        });
      }
      await tx.like.create({
        data: { userId, targetType: LikeTargetType.video, targetId: videoId },
      });
      await tx.video.update({
        where: { id: videoId },
        data: { likesCount: { increment: 1 } },
      });
    });
    void this.notifications.notifyVideoLike(
      video.creatorId,
      userId,
      videoId,
      video.type,
    );
    return { liked: true, disliked: false };
  }

  async toggleDislike(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const existing = await this.prisma.dislike.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: DislikeTargetType.video,
          targetId: videoId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.dislike.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: DislikeTargetType.video,
              targetId: videoId,
            },
          },
        });
        await tx.video.update({
          where: { id: videoId },
          data: { dislikesCount: { decrement: 1 } },
        });
      });
      return { disliked: false };
    }

    await this.prisma.$transaction(async (tx) => {
      const like = await tx.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: LikeTargetType.video,
            targetId: videoId,
          },
        },
      });
      if (like) {
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
      }
      await tx.dislike.create({
        data: {
          userId,
          targetType: DislikeTargetType.video,
          targetId: videoId,
        },
      });
      await tx.video.update({
        where: { id: videoId },
        data: { dislikesCount: { increment: 1 } },
      });
    });
    return { disliked: true, liked: false };
  }

  async toggleCommentLike(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { video: { select: { type: true } } },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: LikeTargetType.comment,
          targetId: commentId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            userId_targetType_targetId: {
              userId,
              targetType: LikeTargetType.comment,
              targetId: commentId,
            },
          },
        });
        await tx.comment.update({
          where: { id: commentId },
          data: { likesCount: { decrement: 1 } },
        });
      });
      return { liked: false, likesCount: Math.max(0, comment.likesCount - 1) };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          userId,
          targetType: LikeTargetType.comment,
          targetId: commentId,
        },
      });
      await tx.comment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      });
    });
    void this.notifications.notifyCommentLike(
      comment.userId,
      userId,
      comment.videoId,
      commentId,
      comment.video.type,
    );
    return { liked: true, likesCount: comment.likesCount + 1 };
  }

  async toggleSave(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video not found');

    const itemType = savedItemTypeForVideo(video.type);

    const existing = await this.prisma.savedItem.findUnique({
      where: { userId_itemType_itemId: { userId, itemType, itemId: videoId } },
    });

    if (existing) {
      await this.prisma.savedItem.delete({
        where: {
          userId_itemType_itemId: { userId, itemType, itemId: videoId },
        },
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
