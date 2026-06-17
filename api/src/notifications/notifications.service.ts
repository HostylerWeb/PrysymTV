import { Injectable } from '@nestjs/common';
import {
  NotificationPrefType,
  NotificationType,
  VideoType,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationMetadata = {
  /** Prevents duplicate notifications (e.g. unlike → like again). */
  dedupeKey?: string;
  videoType?: VideoType | string;
  videoId?: string;
  commentId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async isPrefEnabled(
    userId: string,
    type: NotificationPrefType,
  ): Promise<boolean> {
    const pref = await this.prisma.userNotificationPreference.findUnique({
      where: { userId_type: { userId, type } },
    });
    return pref ? pref.enabled : true;
  }

  private async actorName(actorId: string): Promise<string> {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { displayName: true, username: true },
    });
    return actor?.displayName || actor?.username || 'Someone';
  }

  private async alreadySent(
    recipientId: string,
    dedupeKey: string,
  ): Promise<boolean> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId: recipientId,
        metadata: {
          path: ['dedupeKey'],
          equals: dedupeKey,
        },
      },
      select: { id: true },
    });
    return Boolean(existing);
  }

  async send(params: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    referenceId?: string;
    message: string;
    metadata?: NotificationMetadata;
  }): Promise<void> {
    if (params.recipientId === params.actorId) return;
    if (!(await this.isPrefEnabled(params.recipientId, params.type))) return;

    const dedupeKey = params.metadata?.dedupeKey;
    if (dedupeKey && (await this.alreadySent(params.recipientId, dedupeKey))) {
      return;
    }

    await this.prisma.notification.create({
      data: {
        userId: params.recipientId,
        type: params.type,
        actorId: params.actorId,
        referenceId: params.referenceId,
        message: params.message,
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue,
      },
    });
  }

  async notifyFollow(recipientId: string, actorId: string): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'follow',
      referenceId: actorId,
      message: `${name} started following you`,
    });
  }

  async notifyCommentOnVideo(
    recipientId: string,
    actorId: string,
    videoId: string,
    commentId: string,
    videoType: VideoType,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'comment',
      referenceId: videoId,
      message: `${name} commented on your video`,
      metadata: {
        dedupeKey: `comment:video:${commentId}`,
        videoType,
        videoId,
        commentId,
      },
    });
  }

  async notifyCommentReply(
    recipientId: string,
    actorId: string,
    videoId: string,
    commentId: string,
    videoType: VideoType,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'comment',
      referenceId: videoId,
      message: `${name} replied to your comment`,
      metadata: {
        dedupeKey: `comment:reply:${commentId}`,
        videoType,
        videoId,
        commentId,
      },
    });
  }

  async notifyCommentLike(
    recipientId: string,
    actorId: string,
    videoId: string,
    commentId: string,
    videoType: VideoType,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'like',
      referenceId: videoId,
      message: `${name} liked your comment`,
      metadata: {
        dedupeKey: `like:comment:${actorId}:${commentId}`,
        videoType,
        videoId,
        commentId,
      },
    });
  }

  async notifyVideoLike(
    recipientId: string,
    actorId: string,
    videoId: string,
    videoType: VideoType,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'like',
      referenceId: videoId,
      message: `${name} liked your video`,
      metadata: {
        dedupeKey: `like:video:${actorId}:${videoId}`,
        videoType,
        videoId,
      },
    });
  }

  async notifyGift(
    recipientId: string,
    actorId: string,
    streamId: string | null | undefined,
    giftName: string,
    giftId: string,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'gift',
      referenceId: streamId ?? undefined,
      message: `${name} sent you ${giftName}`,
      metadata: {
        dedupeKey: `gift:${giftId}`,
      },
    });
  }

  async notifyCreatorWentLive(
    creatorId: string,
    streamId: string,
    creatorName: string,
  ): Promise<void> {
    const alerts = await this.prisma.creatorLiveAlert.findMany({
      where: { creatorId },
      select: { userId: true },
    });
    if (alerts.length === 0) return;

    for (const alert of alerts) {
      if (alert.userId === creatorId) continue;
      if (!(await this.isPrefEnabled(alert.userId, 'live'))) continue;
      if (await this.alreadySent(alert.userId, `live:${streamId}`)) continue;

      await this.prisma.notification.create({
        data: {
          userId: alert.userId,
          type: 'live',
          actorId: creatorId,
          referenceId: streamId,
          message: `${creatorName} is live now`,
          metadata: { dedupeKey: `live:${streamId}` },
        },
      });
    }
  }

  async notifyFollowersOfUpload(
    creatorId: string,
    videoId: string,
    videoTitle: string,
    videoType: VideoType,
  ): Promise<void> {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { displayName: true, username: true },
    });
    const name = creator?.displayName || creator?.username || 'A creator you follow';

    const followers = await this.prisma.follow.findMany({
      where: { followingId: creatorId },
      select: { followerId: true },
    });
    if (followers.length === 0) return;

    for (const follower of followers) {
      if (follower.followerId === creatorId) continue;
      if (!(await this.isPrefEnabled(follower.followerId, 'upload'))) continue;
      if (await this.alreadySent(follower.followerId, `upload:${videoId}`)) {
        continue;
      }

      await this.prisma.notification.create({
        data: {
          userId: follower.followerId,
          type: 'upload',
          actorId: creatorId,
          referenceId: videoId,
          message: `${name} posted "${videoTitle}"`,
          metadata: {
            dedupeKey: `upload:${videoId}`,
            videoType,
            videoId,
          },
        },
      });
    }
  }
}
