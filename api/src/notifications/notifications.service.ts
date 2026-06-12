import { Injectable } from '@nestjs/common';
import {
  NotificationPrefType,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

  async send(params: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    referenceId?: string;
    message: string;
  }): Promise<void> {
    if (params.recipientId === params.actorId) return;
    if (!(await this.isPrefEnabled(params.recipientId, params.type))) return;

    await this.prisma.notification.create({
      data: {
        userId: params.recipientId,
        type: params.type,
        actorId: params.actorId,
        referenceId: params.referenceId,
        message: params.message,
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
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'comment',
      referenceId: videoId,
      message: `${name} commented on your video`,
    });
  }

  async notifyCommentReply(
    recipientId: string,
    actorId: string,
    videoId: string,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'comment',
      referenceId: videoId,
      message: `${name} replied to your comment`,
    });
  }

  async notifyCommentLike(
    recipientId: string,
    actorId: string,
    videoId: string,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'like',
      referenceId: videoId,
      message: `${name} liked your comment`,
    });
  }

  async notifyVideoLike(
    recipientId: string,
    actorId: string,
    videoId: string,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'like',
      referenceId: videoId,
      message: `${name} liked your video`,
    });
  }

  async notifyGift(
    recipientId: string,
    actorId: string,
    streamId: string | null | undefined,
    giftName: string,
  ): Promise<void> {
    const name = await this.actorName(actorId);
    await this.send({
      recipientId,
      actorId,
      type: 'gift',
      referenceId: streamId ?? undefined,
      message: `${name} sent you ${giftName}`,
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

    const rows: Array<{
      userId: string;
      type: 'live';
      actorId: string;
      referenceId: string;
      message: string;
    }> = [];

    for (const alert of alerts) {
      if (alert.userId === creatorId) continue;
      if (!(await this.isPrefEnabled(alert.userId, 'live'))) continue;
      rows.push({
        userId: alert.userId,
        type: 'live',
        actorId: creatorId,
        referenceId: streamId,
        message: `${creatorName} is live now`,
      });
    }

    if (rows.length > 0) {
      await this.prisma.notification.createMany({ data: rows });
    }
  }

  async notifyFollowersOfUpload(
    creatorId: string,
    videoId: string,
    videoTitle: string,
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

    const rows: Array<{
      userId: string;
      type: 'upload';
      actorId: string;
      referenceId: string;
      message: string;
    }> = [];

    for (const follower of followers) {
      if (follower.followerId === creatorId) continue;
      if (!(await this.isPrefEnabled(follower.followerId, 'upload'))) continue;
      rows.push({
        userId: follower.followerId,
        type: 'upload',
        actorId: creatorId,
        referenceId: videoId,
        message: `${name} posted "${videoTitle}"`,
      });
    }

    if (rows.length > 0) {
      await this.prisma.notification.createMany({ data: rows });
    }
  }
}
