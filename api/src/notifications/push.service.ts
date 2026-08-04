import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification, User } from '@prisma/client';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPushSubscriptionDto } from './dto/register-push-subscription.dto';
import {
  buildNotificationActionUrl,
  type NotificationMetadata,
} from './notification-url.util';

const FCM_PUSH_ENDPOINT_PREFIX = 'fcm:';
const APNS_PUSH_ENDPOINT_PREFIX = 'apns:';

type NotificationWithActor = Notification & {
  actor?: Pick<User, 'username' | 'displayName'> | null;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly webPushEnabled: boolean;
  private fcmInitialized = false;

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
      this.webPushEnabled = true;
    } else {
      this.webPushEnabled = false;
    }
  }

  isEnabled(): boolean {
    return this.webPushEnabled || this.isFcmEnabled();
  }

  isFcmEnabled(): boolean {
    return Boolean(
      this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH')?.trim() ||
        this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON')?.trim(),
    );
  }

  getPublicKey(): string | null {
    if (!this.webPushEnabled) return null;
    return this.config.get<string>('VAPID_PUBLIC_KEY')?.trim() ?? null;
  }

  private loadFirebaseServiceAccount(): admin.ServiceAccount | null {
    const filePath = this.config
      .get<string>('FIREBASE_SERVICE_ACCOUNT_PATH')
      ?.trim();
    if (filePath) {
      try {
        return JSON.parse(readFileSync(filePath, 'utf8')) as admin.ServiceAccount;
      } catch (err) {
        this.logger.warn(
          `FCM service account file unreadable (${filePath}): ${String(err)}`,
        );
        return null;
      }
    }

    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON')?.trim();
    if (!raw) return null;
    try {
      return JSON.parse(raw) as admin.ServiceAccount;
    } catch (err) {
      this.logger.warn(`FCM service account JSON parse failed: ${String(err)}`);
      return null;
    }
  }

  private ensureFcm(): boolean {
    if (this.fcmInitialized) return true;
    const serviceAccount = this.loadFirebaseServiceAccount();
    if (!serviceAccount) return false;
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      this.fcmInitialized = true;
      return true;
    } catch (err) {
      this.logger.warn(`FCM init failed: ${String(err)}`);
      return false;
    }
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

    const webSubscriptions = subscriptions.filter(
      (sub) =>
        !sub.endpoint.startsWith(FCM_PUSH_ENDPOINT_PREFIX) &&
        !sub.endpoint.startsWith(APNS_PUSH_ENDPOINT_PREFIX),
    );
    const fcmSubscriptions = subscriptions.filter((sub) =>
      sub.endpoint.startsWith(FCM_PUSH_ENDPOINT_PREFIX),
    );

    const deliveries: Promise<void>[] = [];
    if (this.webPushEnabled) {
      deliveries.push(
        ...webSubscriptions.map((sub) => this.sendWebPush(sub, payload)),
      );
    }
    deliveries.push(
      this.sendFcmPush(fcmSubscriptions, {
        title,
        body: notification.message,
        url,
        tag: notification.id,
        type: notification.type,
        referenceId: notification.referenceId,
        metadata,
        actorUsername: notification.actor?.username ?? null,
      }),
    );
    await Promise.all(deliveries);
  }

  private async sendWebPush(
    sub: { id: string; endpoint: string; p256dh: string; auth: string },
    payload: string,
  ): Promise<void> {
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
  }

  private async sendFcmPush(
    subscriptions: Array<{ id: string; endpoint: string }>,
    message: {
      title: string;
      body: string;
      url: string;
      tag: string;
      type: string;
      referenceId: string | null;
      metadata: NotificationMetadata | null;
      actorUsername: string | null;
    },
  ): Promise<void> {
    if (subscriptions.length === 0) return;
    if (!this.ensureFcm()) {
      this.logger.warn(
        'FCM delivery skipped: Firebase service account not configured or invalid',
      );
      return;
    }

    const tokens = subscriptions.map((sub) =>
      sub.endpoint.slice(FCM_PUSH_ENDPOINT_PREFIX.length),
    );

    try {
      // Data-only so expo-notifications builds the notification (play icon in status
      // bar + full-color ic_launcher large icon in the shade). A top-level
      // `notification` block is shown by the OS without the large logo.
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        data: {
          channelId: 'default',
          title: message.title,
          message: message.body,
          url: message.url,
          tag: message.tag,
          type: message.type,
          referenceId: message.referenceId ?? '',
          actorUsername: message.actorUsername ?? '',
          metadata: message.metadata ? JSON.stringify(message.metadata) : '',
        },
        android: {
          priority: 'high',
        },
      });

      await Promise.all(
        response.responses.map(async (result, index) => {
          if (result.success) return;
          const code = result.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            const sub = subscriptions[index];
            if (sub) {
              await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          } else if (result.error) {
            this.logger.warn(`FCM delivery failed: ${result.error.message}`);
          }
        }),
      );
    } catch (err) {
      this.logger.warn(`FCM push delivery failed: ${String(err)}`);
    }
  }
}
