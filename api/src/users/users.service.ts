import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ContentStatus,
  StreamerStatus,
  VerticalCreatorStatus,
} from '@prisma/client';
import {
  mapVideoCard,
  VIDEO_CARD_SELECT,
} from '../common/mappers/content.mapper';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { BillingService } from '../billing/billing.service';
import { StorageService } from '../storage/storage.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateNotificationPrefDto } from './dto/notification-pref.dto';
import { ApplyStreamerDto } from './dto/apply-streamer.dto';
import { ApplyVerticalCreatorDto } from './dto/apply-vertical-creator.dto';
import {
  CreatorAccessFeature,
  RequestCreatorAccessDto,
} from './dto/request-creator-access.dto';
import { ReplaceSocialLinksDto } from './dto/social-links.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly billing: BillingService,
    private readonly playlists: PlaylistsService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialLinks: { orderBy: { sortOrder: 'asc' } },
        notificationPrefs: true,
        programVerticals: { select: { vertical: true } },
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

  async initProfileImageUpload(
    userId: string,
    kind: 'avatar' | 'banner',
    mimeType: string,
    fileName?: string,
  ) {
    const ext = this.storage.extensionFromFileName(fileName) || '.jpg';
    const prefix = kind === 'avatar' ? 'uploads/avatars' : 'uploads/banners';
    const objectKey = `${prefix}/${userId}${ext}`;
    const target = await this.storage.createUploadTargetForKey(
      objectKey,
      mimeType,
    );
    return {
      ...target,
      publicUrl: this.storage.getPublicUrl(objectKey),
      kind,
    };
  }

  async initStreamerIdUpload(
    userId: string,
    mimeType: string,
    fileName?: string,
  ) {
    const ext = this.storage.extensionFromFileName(fileName) || '.jpg';
    const objectKey = `uploads/streamer-ids/${userId}${ext}`;
    const target = await this.storage.createUploadTargetForKey(
      objectKey,
      mimeType,
    );
    return {
      ...target,
      publicUrl: this.storage.getPublicUrl(objectKey),
      kind: 'streamer_id' as const,
    };
  }

  async assertProfileObjectKey(userId: string, objectKey: string) {
    const allowed = [
      `uploads/avatars/${userId}`,
      `uploads/banners/${userId}`,
      `uploads/streamer-ids/${userId}`,
    ];
    const key = objectKey.replace(/^\/+/, '');
    const ok = allowed.some(
      (prefix) => key === prefix || key.startsWith(`${prefix}.`),
    );
    if (!ok) {
      throw new BadRequestException('Invalid profile image key');
    }
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

    const autoApprove = this.isAutoApproveStreamerEnabled();
    const nextStatus = autoApprove
      ? StreamerStatus.approved
      : StreamerStatus.pending;
    const applicationStatus = autoApprove ? 'approved' : 'pending';

    await this.prisma.$transaction([
      this.prisma.streamerApplication.upsert({
        where: { userId },
        create: {
          userId,
          description: dto.description,
          idDocumentUrl: dto.idDocumentUrl,
          status: applicationStatus,
        },
        update: {
          description: dto.description,
          idDocumentUrl: dto.idDocumentUrl,
          status: applicationStatus,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { streamerStatus: nextStatus },
      }),
    ]);
    return { success: true, streamerStatus: nextStatus, autoApproved: autoApprove };
  }

  async applyVerticalCreator(userId: string, dto: ApplyVerticalCreatorDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (user.verticalCreatorStatus === VerticalCreatorStatus.approved) {
      throw new BadRequestException('Already an approved vertical creator');
    }
    if (user.verticalCreatorStatus === VerticalCreatorStatus.pending) {
      throw new ConflictException('Application already pending');
    }

    const autoApprove = this.isAutoApproveVerticalCreatorEnabled();
    const nextStatus = autoApprove
      ? VerticalCreatorStatus.approved
      : VerticalCreatorStatus.pending;
    const applicationStatus = autoApprove ? 'approved' : 'pending';

    await this.prisma.$transaction([
      this.prisma.verticalCreatorApplication.upsert({
        where: { userId },
        create: {
          userId,
          description: dto.description,
          idDocumentUrl: dto.idDocumentUrl,
          portfolioUrl: dto.portfolioUrl?.trim() || null,
          status: applicationStatus,
        },
        update: {
          description: dto.description,
          idDocumentUrl: dto.idDocumentUrl,
          portfolioUrl: dto.portfolioUrl?.trim() || null,
          status: applicationStatus,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { verticalCreatorStatus: nextStatus },
      }),
    ]);
    return {
      success: true,
      verticalCreatorStatus: nextStatus,
      autoApproved: autoApprove,
    };
  }

  async requestCreatorAccess(userId: string, dto: RequestCreatorAccessDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { streamerApplication: true },
    });
    if (!user) throw new NotFoundException();

    const identityVerified = user.streamerStatus === StreamerStatus.approved;
    const description =
      dto.description?.trim() ||
      'Creator access requested from profile unlock flow.';
    const results: Record<string, string> = {};

    for (const feature of dto.features) {
      if (feature === CreatorAccessFeature.vertical) {
        if (user.verticalCreatorStatus === VerticalCreatorStatus.approved) {
          results.vertical = 'already_approved';
          continue;
        }
        if (user.verticalCreatorStatus === VerticalCreatorStatus.pending) {
          results.vertical = 'pending';
          continue;
        }

        if (identityVerified || this.isAutoApproveVerticalCreatorEnabled()) {
          const idDocumentUrl =
            user.streamerApplication?.idDocumentUrl ?? undefined;
          if (!idDocumentUrl && !this.isAutoApproveVerticalCreatorEnabled()) {
            results.vertical = 'needs_id_verification';
            continue;
          }
          await this.prisma.$transaction([
            this.prisma.verticalCreatorApplication.upsert({
              where: { userId },
              create: {
                userId,
                description,
                idDocumentUrl: idDocumentUrl ?? null,
                status: 'approved',
                reviewNotes: identityVerified
                  ? 'Auto-approved: verified streamer identity on file'
                  : 'Auto-approved: dev setting',
              },
              update: {
                description,
                idDocumentUrl: idDocumentUrl ?? undefined,
                status: 'approved',
                reviewNotes: identityVerified
                  ? 'Auto-approved: verified streamer identity on file'
                  : 'Auto-approved: dev setting',
              },
            }),
            this.prisma.user.update({
              where: { id: userId },
              data: { verticalCreatorStatus: VerticalCreatorStatus.approved },
            }),
          ]);
          results.vertical = 'approved';
        } else {
          results.vertical = 'needs_id_verification';
        }
      }

      if (feature === CreatorAccessFeature.live) {
        if (user.streamerStatus === StreamerStatus.approved) {
          results.live = 'already_approved';
        } else if (user.streamerStatus === StreamerStatus.pending) {
          results.live = 'pending';
        } else {
          results.live = 'needs_id_verification';
        }
      }
    }

    return {
      success: true,
      identityVerified,
      results,
    };
  }

  async getPublicVideos(username: string, page = 1, limit = 24) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (!user || user.isBanned) throw new NotFoundException('Creator not found');

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          creatorId: user.id,
          status: ContentStatus.ready,
          visibility: 'public',
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: VIDEO_CARD_SELECT,
      }),
      this.prisma.video.count({
        where: { creatorId: user.id, status: ContentStatus.ready },
      }),
    ]);

    return {
      items: items.map(mapVideoCard),
      meta: { page, limit, total },
    };
  }

  async getPublicProfile(username: string, viewerId?: string) {
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

    let isFollowing = false;
    let isChannelMember = false;
    let liveAlertsOn = false;
    if (viewerId && viewerId !== user.id) {
      const [row, alert] = await Promise.all([
        this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: user.id,
            },
          },
        }),
        this.prisma.creatorLiveAlert.findUnique({
          where: {
            userId_creatorId: {
              userId: viewerId,
              creatorId: user.id,
            },
          },
        }),
      ]);
      isFollowing = !!row;
      liveAlertsOn = !!alert;
      isChannelMember = await this.billing.isActiveCreatorMember(
        viewerId,
        user.id,
      );
    }

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
      isFollowing,
      isChannelMember,
      liveAlertsOn,
    };
  }

  async toggleLiveAlert(subscriberId: string, username: string) {
    const creator = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });
    if (!creator || creator.isBanned) {
      throw new NotFoundException('Creator not found');
    }
    if (creator.id === subscriberId) {
      throw new BadRequestException('Cannot subscribe to your own alerts');
    }

    const existing = await this.prisma.creatorLiveAlert.findUnique({
      where: {
        userId_creatorId: {
          userId: subscriberId,
          creatorId: creator.id,
        },
      },
    });

    if (existing) {
      await this.prisma.creatorLiveAlert.delete({
        where: {
          userId_creatorId: {
            userId: subscriberId,
            creatorId: creator.id,
          },
        },
      });
      return { enabled: false };
    }

    await this.prisma.creatorLiveAlert.create({
      data: { userId: subscriberId, creatorId: creator.id },
    });
    return { enabled: true };
  }

  async getPublicPlaylists(username: string) {
    const user = await this.prisma.user.findFirst({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Creator not found');
    return this.playlists.listPublicByCreatorId(user.id);
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

    void this.notifications.notifyFollow(target.id, followerId);

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
    const [saved, total] = await Promise.all([
      this.prisma.savedItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.savedItem.count({ where: { userId } }),
    ]);
    const videoIds = saved
      .filter((s) => s.itemType === 'video' || s.itemType === 'movie')
      .map((s) => s.itemId);
    const podcastIds = saved
      .filter((s) => s.itemType === 'podcast_episode')
      .map((s) => s.itemId);
    const verticalEpisodeIds = saved
      .filter((s) => s.itemType === 'vertical_episode')
      .map((s) => s.itemId);
    const verticalSeriesIds = saved
      .filter((s) => s.itemType === 'vertical_series')
      .map((s) => s.itemId);

    const [videos, podcasts, verticalEpisodes, verticalSeries] =
      await Promise.all([
        videoIds.length > 0
          ? this.prisma.video.findMany({ where: { id: { in: videoIds } } })
          : Promise.resolve([]),
        podcastIds.length > 0
          ? this.prisma.podcastEpisode.findMany({
              where: { id: { in: podcastIds } },
              include: {
                show: { select: { id: true, title: true, coverUrl: true } },
              },
            })
          : Promise.resolve([]),
        verticalEpisodeIds.length > 0
          ? this.prisma.verticalEpisode.findMany({
              where: { id: { in: verticalEpisodeIds } },
              include: {
                series: {
                  select: { id: true, slug: true, title: true, posterUrl: true },
                },
              },
            })
          : Promise.resolve([]),
        verticalSeriesIds.length > 0
          ? this.prisma.verticalSeries.findMany({
              where: { id: { in: verticalSeriesIds } },
            })
          : Promise.resolve([]),
      ]);

    const videoById = new Map(videos.map((v) => [v.id, v]));
    const podcastById = new Map(podcasts.map((p) => [p.id, p]));
    const verticalEpisodeById = new Map(verticalEpisodes.map((e) => [e.id, e]));
    const verticalSeriesById = new Map(verticalSeries.map((s) => [s.id, s]));

    const items = saved.map((s) => ({
      itemType: s.itemType,
      itemId: s.itemId,
      createdAt: s.createdAt,
      video:
        s.itemType === 'video' || s.itemType === 'movie'
          ? (videoById.get(s.itemId) ?? null)
          : null,
      podcastEpisode:
        s.itemType === 'podcast_episode'
          ? (podcastById.get(s.itemId) ?? null)
          : null,
      verticalEpisode:
        s.itemType === 'vertical_episode'
          ? (verticalEpisodeById.get(s.itemId) ?? null)
          : null,
      verticalSeries:
        s.itemType === 'vertical_series'
          ? (verticalSeriesById.get(s.itemId) ?? null)
          : null,
    }));
    return { items, meta: { page, limit, total } };
  }

  async getMyLiked(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({ where: { userId } }),
    ]);
    const videoIds = likes
      .filter((l) => l.targetType === 'video')
      .map((l) => l.targetId);
    const podcastIds = likes
      .filter((l) => l.targetType === 'podcast_episode')
      .map((l) => l.targetId);
    const verticalEpisodeIds = likes
      .filter((l) => l.targetType === 'vertical_episode')
      .map((l) => l.targetId);

    const [videos, podcasts, verticalEpisodes] = await Promise.all([
      videoIds.length > 0
        ? this.prisma.video.findMany({ where: { id: { in: videoIds } } })
        : Promise.resolve([]),
      podcastIds.length > 0
        ? this.prisma.podcastEpisode.findMany({
            where: { id: { in: podcastIds } },
            include: {
              show: { select: { id: true, title: true, coverUrl: true } },
            },
          })
        : Promise.resolve([]),
      verticalEpisodeIds.length > 0
        ? this.prisma.verticalEpisode.findMany({
            where: { id: { in: verticalEpisodeIds } },
            include: {
              series: {
                select: { id: true, slug: true, title: true, posterUrl: true },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const videoById = new Map(videos.map((v) => [v.id, v]));
    const podcastById = new Map(podcasts.map((p) => [p.id, p]));
    const verticalEpisodeById = new Map(verticalEpisodes.map((e) => [e.id, e]));

    const items = likes.map((l) => ({
      targetType: l.targetType,
      targetId: l.targetId,
      createdAt: l.createdAt,
      video: l.targetType === 'video' ? (videoById.get(l.targetId) ?? null) : null,
      podcastEpisode:
        l.targetType === 'podcast_episode'
          ? (podcastById.get(l.targetId) ?? null)
          : null,
      verticalEpisode:
        l.targetType === 'vertical_episode'
          ? (verticalEpisodeById.get(l.targetId) ?? null)
          : null,
    }));
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

  private isAutoApproveStreamerEnabled(): boolean {
    if (this.config.get<string>('NODE_ENV') === 'production') return false;
    const raw = this.config.get<string>('AUTO_APPROVE_STREAMER');
    return raw === 'true' || raw === '1';
  }

  private isAutoApproveVerticalCreatorEnabled(): boolean {
    if (this.config.get<string>('NODE_ENV') === 'production') return false;
    const raw = this.config.get<string>('AUTO_APPROVE_VERTICAL_CREATOR');
    return raw === 'true' || raw === '1';
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
    verticalCreatorStatus: string;
    partnerTier?: string;
    programVerticals?: { vertical: string }[];
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
      verticalCreatorStatus: user.verticalCreatorStatus,
      partnerTier: user.partnerTier ?? 'standard',
      programVerticals:
        user.programVerticals?.map((p) => p.vertical) ?? [],
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
