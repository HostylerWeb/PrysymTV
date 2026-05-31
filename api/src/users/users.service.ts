import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StreamerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateNotificationPrefDto } from './dto/notification-pref.dto';
import { ApplyStreamerDto } from './dto/apply-streamer.dto';
import { ReplaceSocialLinksDto } from './dto/social-links.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialLinks: { orderBy: { sortOrder: 'asc' } },
        notificationPrefs: true,
        _count: {
          select: {
            followers: true,
            following: true,
            videos: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        bannerUrl: dto.bannerUrl,
      },
    });
    return this.sanitizeUser(user);
  }

  async getNotificationPreferences(userId: string) {
    return this.prisma.userNotificationPreference.findMany({
      where: { userId },
    });
  }

  async updateNotificationPreference(
    userId: string,
    dto: UpdateNotificationPrefDto,
  ) {
    return this.prisma.userNotificationPreference.upsert({
      where: { userId_type: { userId, type: dto.type } },
      create: { userId, type: dto.type, enabled: dto.enabled },
      update: { enabled: dto.enabled },
    });
  }

  async replaceSocialLinks(userId: string, dto: ReplaceSocialLinksDto) {
    await this.prisma.$transaction([
      this.prisma.userSocialLink.deleteMany({ where: { userId } }),
      this.prisma.userSocialLink.createMany({
        data: dto.links.map((l) => ({
          userId,
          label: l.label,
          url: l.url,
          sortOrder: l.sortOrder,
        })),
      }),
    ]);
    return this.getMe(userId);
  }

  async applyStreamer(userId: string, dto: ApplyStreamerDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (user.streamerStatus === StreamerStatus.approved) {
      throw new BadRequestException('Already an approved streamer');
    }
    if (user.streamerStatus === StreamerStatus.pending) {
      throw new ConflictException('Application already pending');
    }
    await this.prisma.$transaction([
      this.prisma.streamerApplication.upsert({
        where: { userId },
        create: {
          userId,
          description: dto.description,
          idDocumentUrl: dto.idDocumentUrl,
        },
        update: {
          description: dto.description,
          idDocumentUrl: dto.idDocumentUrl,
          status: 'pending',
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { streamerStatus: StreamerStatus.pending },
      }),
    ]);
    return { success: true, streamerStatus: StreamerStatus.pending };
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase() },
      include: {
        socialLinks: { orderBy: { sortOrder: 'asc' } },
        streams: {
          where: { status: 'live' },
          take: 1,
        },
        _count: { select: { followers: true, following: true, videos: true } },
      },
    });
    if (!user || user.isBanned)
      throw new NotFoundException('Creator not found');
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      isVerified: user.isVerified,
      streamerStatus: user.streamerStatus,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      videosCount: user._count.videos,
      isLive: user.streams.length > 0,
      liveStreamId: user.streams[0]?.id ?? null,
      socialLinks: user.socialLinks,
    };
  }

  async follow(followerId: string, username: string) {
    const target = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === followerId)
      throw new BadRequestException('Cannot follow yourself');
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId: target.id },
      },
      create: { followerId, followingId: target.id },
      update: {},
    });
    return { success: true, following: true };
  }

  async unfollow(followerId: string, username: string) {
    const target = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (!target) throw new NotFoundException('User not found');
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: target.id },
    });
    return { success: true, following: false };
  }

  async getMyVideos(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.video.count({ where: { creatorId: userId } }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async getMySaved(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.savedItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.savedItem.count({ where: { userId } }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async getMyLiked(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({ where: { userId } }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async getNotifications(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async clearNotifications(userId: string) {
    await this.prisma.notification.deleteMany({ where: { userId } });
    return { success: true };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    role: string;
    isVerified: boolean;
    streamerStatus: string;
    coinsBalance: number;
    premiumTier: string;
    premiumExpiresAt: Date | null;
    createdAt: Date;
    socialLinks?: unknown[];
    notificationPrefs?: unknown[];
    _count?: { followers: number; following: number; videos: number };
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      role: user.role,
      isVerified: user.isVerified,
      streamerStatus: user.streamerStatus,
      coinsBalance: user.coinsBalance,
      premiumTier: user.premiumTier,
      premiumExpiresAt: user.premiumExpiresAt,
      createdAt: user.createdAt,
      socialLinks: user.socialLinks,
      notificationPrefs: user.notificationPrefs,
      followersCount: user._count?.followers ?? 0,
      followingCount: user._count?.following ?? 0,
      videosCount: user._count?.videos ?? 0,
    };
  }
}
