import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification, User } from '@prisma/client';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';
import {
  buildNotificationActionUrl,
  type NotificationMetadata,
} from './notification-url.util';

type NotificationWithActor = Notification & {
  actor?: Pick<User, 'username' | 'displayName'> | null;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY')?.trim();
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY')?.trim();
    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        this.config.get<string>('VAPID_SUBJECT', 'mailto:support@prysym.tv'),
        publicKey,
        privateKey,
      );
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPublicKey(): string | null {
    if (!this.enabled) return null;
    return this.config.get<string>('VAPID_PUBLIC_KEY')?.trim() ?? null;
  }

  async registerSubscription(
    userId: string,
    dto: RegisterPushSubscriptionDto,
    userAgent?: string,
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent ?? null,
      },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent ?? null,
      },
    });
  }

  async unregisterSubscription(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { success: true };
  }

  async hasSubscription(userId: string): Promise<boolean> {
    const count = await this.prisma.pushSubscription.count({
      where: { userId },
    });
    return count > 0;
  }

  async sendForNotification(notification: NotificationWithActor): Promise<void> {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: notification.userId },
    });
    if (subscriptions.length === 0) return;

    const metadata = notification.metadata as NotificationMetadata | null;
    const actorName =
      notification.actor?.displayName ||
      notification.actor?.username?.replace(/^@/, '') ||
      'Prysym TV';
    const title =
      notification.type === 'system' ? 'Prysym TV' : actorName;
    const url = buildNotificationActionUrl(
      notification.type,
      notification.referenceId,
      metadata,
      notification.actor?.username,
    );

    const payload = JSON.stringify({
      title,
      body: notification.message,
      url,
      tag: notification.id,
    });

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({
              where: { id: sub.id },
            });
            return;
          }
          this.logger.warn(
            `Push delivery failed for subscription ${sub.id}: ${String(err)}`,
          );
        }
      }),
    );
  }
}
