import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdCampaignStatus,
  AnalyticsEventType,
  ApplicationStatus,
  ContentStatus,
  ContentVertical,
  CreatorBalanceEntryType,
  CreatorPartnerTier,
  PayoutStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  StreamStatus,
  StoreProductStatus,
  StreamerStatus,
  StoreCreatorStatus,
  UserRole,
  VerticalCreatorStatus,
  VideoType,
} from '@prisma/client';
import { geoFromMetadata } from '../common/geo/request-geo';
import { packagePriceFromCoins } from '../common/utils/coin-usd.util';
import { AdvertisersService } from '../advertisers/advertisers.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { GafService } from '../gaf/gaf.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditLogService } from './audit-log.service';
import { AdCampaignQueryDto } from './dto/ad-campaign-query.dto';
import { CreateAdCampaignDto } from './dto/create-ad-campaign.dto';
import { UpdateAdCampaignDto } from './dto/update-ad-campaign.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminReportAction } from './dto/review-report.dto';
import { AdminPayoutAction } from './dto/process-payout.dto';
import { StreamerApplicationAction } from './dto/review-streamer-application.dto';
import { VerticalCreatorApplicationAction } from './dto/review-vertical-creator-application.dto';
import { StoreCreatorApplicationAction } from './dto/review-store-creator-application.dto';
import { UpdateAdsConfigDto } from './dto/update-ads-config.dto';
import { UpdateAnalyticsConfigDto } from './dto/update-analytics-config.dto';
import { UpdateEconomyConfigDto } from './dto/update-economy-config.dto';
import { UpdateScorecardConfigDto } from './dto/update-scorecard-config.dto';
import { UpsertCoinPackageDto } from './dto/upsert-coin-package.dto';
import { UpsertGiftCatalogDto } from './dto/upsert-gift-catalog.dto';
import { UpdateUserImpactDto } from './dto/update-user-impact.dto';
import {
  type AdminDateRangeInput,
  createdAtFilter,
  resolveAdminDateRange,
} from './admin-date-range.util';
import type {
  AdsSettings,
  AnalyticsSettings,
  CategoryConfigEntry,
  ProgramConfigEntry,
  ScorecardSettings,
} from '../platform-settings/platform-settings.types';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
    private readonly auditLog: AuditLogService,
    private readonly advertisers: AdvertisersService,
    private readonly gaf: GafService,
    private readonly storage: StorageService,
    private readonly playlists: PlaylistsService,
  ) {}

  private paginate(page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    };
  }

  /**
   * Podcast episodes are created as `processing` before upload. Only videos/movies/shorts
   * use the BullMQ transcode queue. Shells with no media are abandoned uploads, not transcoding.
   */
  private podcastTranscodingWhere() {
    return {
      status: ContentStatus.processing,
      OR: [{ audioUrl: { not: null } }, { videoUrl: { not: null } }],
    };
  }

  /** Mark old podcast shells (never uploaded) as failed so they leave the processing bell. */
  private async reconcileAbandonedPodcastShells(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.prisma.podcastEpisode.updateMany({
      where: {
        status: ContentStatus.processing,
        audioUrl: null,
        videoUrl: null,
        createdAt: { lt: cutoff },
      },
      data: { status: ContentStatus.failed },
    });
  }

  async getOverview() {
    await this.reconcileAbandonedPodcastShells();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      analyticsDauRows,
      watchDauRows,
      liveStreams,
      revenueAgg,
      pendingReports,
      pendingPayouts,
      pendingApps,
      pendingVerticalApps,
      pendingStoreApps,
      processingVideos,
      processingVerticalEpisodes,
      processingPodcastEpisodes,
    ] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since24h }, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.watchHistory.findMany({
        where: { updatedAt: { gte: since24h } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.stream.findMany({
        where: { status: StreamStatus.live },
        select: { viewerCount: true },
      }),
      this.prisma.revenueLedgerBatch.aggregate({
        where: { createdAt: { gte: startOfDay } },
        _sum: { grossAmountUsd: true },
      }),
      this.prisma.report.count({ where: { status: ReportStatus.pending } }),
      this.prisma.creatorPayout.findMany({
        where: { status: PayoutStatus.requested },
        select: { amountUsd: true },
      }),
      this.prisma.streamerApplication.count({
        where: { status: ApplicationStatus.pending },
      }),
      this.prisma.verticalCreatorApplication.count({
        where: { status: ApplicationStatus.pending },
      }),
      this.prisma.storeCreatorApplication.count({
        where: { status: ApplicationStatus.pending },
      }),
      this.prisma.video.count({ where: { status: ContentStatus.processing } }),
      this.prisma.verticalEpisode.count({
        where: { status: ContentStatus.processing },
      }),
      this.prisma.podcastEpisode.count({
        where: this.podcastTranscodingWhere(),
      }),
    ]);

    const pendingPayoutsUsd = pendingPayouts.reduce(
      (sum, p) => sum.plus(p.amountUsd),
      new Prisma.Decimal(0),
    );

    const dauUserIds = new Set<string>();
    for (const row of analyticsDauRows) {
      if (row.userId) dauUserIds.add(row.userId);
    }
    for (const row of watchDauRows) {
      dauUserIds.add(row.userId);
    }

    return {
      dau: dauUserIds.size,
      liveNow: liveStreams.length,
      liveViewers: liveStreams.reduce((s, x) => s + x.viewerCount, 0),
      revenueTodayUsd: Number(revenueAgg._sum.grossAmountUsd ?? 0),
      pendingReports,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutsUsd: Number(pendingPayoutsUsd),
      pendingStreamerApplications: pendingApps,
      pendingVerticalCreatorApplications: pendingVerticalApps,
      pendingStoreCreatorApplications: pendingStoreApps,
      pendingApplications: pendingApps + pendingVerticalApps + pendingStoreApps,
      processingVideos,
      processingVerticalEpisodes,
      processingPodcastEpisodes,
      processingTotal:
        processingVideos + processingVerticalEpisodes + processingPodcastEpisodes,
    };
  }

  async listProcessingContent(limit = 20) {
    await this.reconcileAbandonedPodcastShells();

    const take = Math.min(Math.max(limit, 1), 50);
    const [videos, verticalEpisodes, podcastEpisodes, videoTotal, verticalTotal, podcastTotal] =
      await Promise.all([
      this.prisma.video.findMany({
        where: { status: ContentStatus.processing },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          creator: { select: { username: true } },
        },
      }),
      this.prisma.verticalEpisode.findMany({
        where: { status: ContentStatus.processing },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          title: true,
          episodeNumber: true,
          createdAt: true,
          updatedAt: true,
          series: { select: { title: true, slug: true } },
        },
      }),
      this.prisma.podcastEpisode.findMany({
        where: this.podcastTranscodingWhere(),
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          show: { select: { title: true } },
        },
      }),
      this.prisma.video.count({ where: { status: ContentStatus.processing } }),
      this.prisma.verticalEpisode.count({
        where: { status: ContentStatus.processing },
      }),
      this.prisma.podcastEpisode.count({
        where: this.podcastTranscodingWhere(),
      }),
    ]);

    const items = [
      ...videos.map((v) => ({
        id: v.id,
        title: v.title,
        kind: v.type as string,
        label:
          v.type === VideoType.movie
            ? 'Movie'
            : v.type === VideoType.short
              ? 'Short'
              : 'Video',
        creator: v.creator ? `@${v.creator.username}` : undefined,
        submittedAt: v.updatedAt.toISOString(),
        stage: 'transcoding' as const,
        adminHref: `/admin/content/${v.type === VideoType.movie ? 'movies' : v.type === VideoType.short ? 'shorts' : 'videos'}`,
      })),
      ...verticalEpisodes.map((ep) => ({
        id: ep.id,
        title: ep.title,
        kind: 'vertical_episode',
        label: 'Vertical episode',
        seriesTitle: ep.series.title,
        episodeNumber: ep.episodeNumber,
        submittedAt: ep.updatedAt.toISOString(),
        stage: 'transcoding' as const,
        adminHref: '/admin/content/verticals',
      })),
      ...podcastEpisodes.map((ep) => ({
        id: ep.id,
        title: ep.title,
        kind: 'podcast_episode',
        label: 'Podcast episode',
        seriesTitle: ep.show.title,
        submittedAt: ep.updatedAt.toISOString(),
        stage: 'transcoding' as const,
        adminHref: '/admin/content/podcasts',
      })),
    ].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );

    return {
      items: items.slice(0, take),
      total: videoTotal + verticalTotal + podcastTotal,
    };
  }

  async listApplications(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const statusFilter =
      query.status && query.status !== 'all'
        ? (query.status as ApplicationStatus)
        : undefined;

    const type = query.type?.toLowerCase();
    const includeStreamer = !type || type === 'all' || type === 'streamer';
    const includeVertical = !type || type === 'all' || type === 'vertical';
    const includeStore = !type || type === 'all' || type === 'store';

    const streamerWhere: Prisma.StreamerApplicationWhereInput = {};
    const verticalWhere: Prisma.VerticalCreatorApplicationWhereInput = {};
    const storeWhere: Prisma.StoreCreatorApplicationWhereInput = {};
    if (statusFilter) {
      streamerWhere.status = statusFilter;
      verticalWhere.status = statusFilter;
      storeWhere.status = statusFilter;
    }

    const [streamerItems, verticalItems, storeItems] = await Promise.all([
      includeStreamer
        ? this.prisma.streamerApplication.findMany({
            where: streamerWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      includeVertical
        ? this.prisma.verticalCreatorApplication.findMany({
            where: verticalWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      includeStore
        ? this.prisma.storeCreatorApplication.findMany({
            where: storeWhere,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const merged = [
      ...streamerItems.map((a) => ({
        id: a.id,
        type: 'streamer' as const,
        userId: a.userId,
        username: a.user.username,
        displayName: a.user.displayName,
        description: a.description,
        status: a.status,
        submittedAt: a.createdAt.toISOString(),
        hasIdDocument: !!a.idDocumentUrl,
        portfolioUrl: null as string | null,
      })),
      ...verticalItems.map((a) => ({
        id: a.id,
        type: 'vertical' as const,
        userId: a.userId,
        username: a.user.username,
        displayName: a.user.displayName,
        description: a.description,
        status: a.status,
        submittedAt: a.createdAt.toISOString(),
        hasIdDocument: !!a.idDocumentUrl,
        portfolioUrl: a.portfolioUrl,
      })),
      ...storeItems.map((a) => ({
        id: a.id,
        type: 'store' as const,
        userId: a.userId,
        username: a.user.username,
        displayName: a.user.displayName,
        description: a.description,
        status: a.status,
        submittedAt: a.createdAt.toISOString(),
        hasIdDocument: !!a.idDocumentUrl,
        portfolioUrl: null as string | null,
        acceptedTerms: a.acceptedTerms,
      })),
    ].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );

    const total = merged.length;
    const items = merged.slice(skip, skip + take);

    return { items, meta: { page, limit, total } };
  }

  async listReports(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.ReportWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as ReportStatus;
    }
    const createdAt = createdAtFilter(query);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          reporter: { select: { username: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    const mapped = await Promise.all(
      items.map(async (r) => ({
        id: r.id,
        status: r.status,
        targetType: r.targetType,
        targetId: r.targetId,
        targetTitle: await this.resolveTargetTitle(r.targetType, r.targetId),
        reason: r.reason,
        reporter: `@${r.reporter.username}`,
        createdAt: r.createdAt.toISOString(),
      })),
    );

    return { items: mapped, meta: { page, limit, total } };
  }

  async getReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, username: true, displayName: true } },
        reviewedBy: { select: { id: true, username: true } },
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const target = await this.hydrateTarget(report.targetType, report.targetId);

    return {
      id: report.id,
      status: report.status,
      targetType: report.targetType,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      reporter: {
        id: report.reporter.id,
        username: report.reporter.username,
        displayName: report.reporter.displayName,
      },
      reviewedBy: report.reviewedBy,
      createdAt: report.createdAt.toISOString(),
      target,
    };
  }

  async deleteReport(id: string, adminId: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    await this.prisma.report.delete({ where: { id } });

    await this.auditLog.log({
      adminId,
      action: 'report.delete',
      entityType: 'report',
      entityId: id,
      metadata: {
        targetType: report.targetType,
        targetId: report.targetId,
        status: report.status,
      },
    });

    return { success: true };
  }

  async reviewReport(
    id: string,
    adminId: string,
    action: AdminReportAction,
    notes?: string,
  ) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    if (action === AdminReportAction.dismiss) {
      await this.prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.dismissed,
          reviewedById: adminId,
          description: notes?.trim() || report.description,
        },
      });
      return { success: true, status: ReportStatus.dismissed };
    }

    if (action === AdminReportAction.delete_content) {
      await this.deleteTargetContent(report.targetType, report.targetId);
      await this.prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.actioned,
          reviewedById: adminId,
          description: notes?.trim() || report.description,
        },
      });
      return { success: true, status: ReportStatus.actioned };
    }

    if (action === AdminReportAction.ban_user) {
      const userId = await this.resolveTargetOwnerId(
        report.targetType,
        report.targetId,
      );
      if (!userId) {
        throw new BadRequestException('Cannot resolve user to ban for this target');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
      });
      await this.prisma.report.update({
        where: { id },
        data: {
          status: ReportStatus.actioned,
          reviewedById: adminId,
          description: notes?.trim() || report.description,
        },
      });
      return { success: true, status: ReportStatus.actioned, bannedUserId: userId };
    }

    throw new BadRequestException('Invalid action');
  }

  async listUsers(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.UserWhereInput = {};

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.status === 'banned') where.isBanned = true;
    if (query.status === 'active') where.isBanned = false;
    if (query.type && query.type !== 'all') {
      where.role = query.type as Prisma.EnumUserRoleFilter['equals'];
    }
    const createdAt = createdAtFilter(query);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          role: true,
          isVerified: true,
          isBanned: true,
          streamerStatus: true,
          partnerTier: true,
          coinsBalance: true,
          gender: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        isVerified: u.isVerified,
        isBanned: u.isBanned,
        streamerStatus: u.streamerStatus,
        partnerTier: u.partnerTier,
        coins: u.coinsBalance,
        gender: u.gender,
        joinedAt: u.createdAt.toISOString().slice(0, 10),
      })),
      meta: { page, limit, total },
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        socialLinks: { orderBy: { sortOrder: 'asc' } },
        streamerApplication: true,
        verticalCreatorApplication: true,
        storeCreatorApplication: true,
        creatorStore: {
          include: {
            products: { orderBy: { createdAt: 'desc' } },
          },
        },
        payoutProfile: true,
        _count: {
          select: {
            videos: true,
            reportsFiled: true,
            reportsReviewed: true,
            followers: true,
            following: true,
            streams: true,
            podcastShows: true,
            verticalSeries: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const ownedVideoIds = (
      await this.prisma.video.findMany({
        where: { creatorId: id },
        select: { id: true },
        take: 100,
      })
    ).map((v) => v.id);

    const [reportsReceived, reportsFiled, balance] = await Promise.all([
      this.prisma.report.findMany({
        where: {
          OR: [
            { targetType: ReportTargetType.user, targetId: id },
            ...(ownedVideoIds.length
              ? [{ targetType: ReportTargetType.video, targetId: { in: ownedVideoIds } }]
              : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.report.findMany({
        where: { reporterId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.creatorBalanceLedger.aggregate({
        where: { creatorId: id, entryType: CreatorBalanceEntryType.credit },
        _sum: { amountUsd: true },
      }),
    ]);

    const [videos, verticalEpisodes, podcastEpisodes, verticalSeries] =
      await Promise.all([
        this.prisma.video.findMany({
          where: { creatorId: id },
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            viewsCount: true,
          },
        }),
        this.prisma.verticalEpisode.findMany({
          where: { series: { creatorId: id } },
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true,
            title: true,
            episodeNumber: true,
            status: true,
            viewsCount: true,
            series: { select: { slug: true, title: true } },
          },
        }),
        this.prisma.podcastEpisode.findMany({
          where: { creatorId: id },
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true,
            title: true,
            status: true,
            playsCount: true,
            show: { select: { title: true } },
          },
        }),
        this.prisma.verticalSeries.findMany({
          where: { creatorId: id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            slug: true,
            title: true,
            status: true,
            totalEpisodes: true,
          },
        }),
      ]);

    const content = [
      ...videos.map((v) => ({
        type: v.type,
        title: v.title,
        id: v.id,
        views: v.viewsCount,
        status: v.status,
        siteHref:
          v.type === 'movie'
            ? `/movie/${v.id}`
            : v.type === 'short'
              ? `/shorts/${v.id}`
              : `/watch/${v.id}`,
      })),
      ...verticalEpisodes.map((ep) => ({
        type: 'vertical_episode',
        title: `${ep.series.title} — Ep ${ep.episodeNumber}: ${ep.title}`,
        id: ep.id,
        views: ep.viewsCount,
        status: ep.status,
        siteHref: `/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`,
      })),
      ...podcastEpisodes.map((ep) => ({
        type: 'podcast_episode',
        title: ep.show.title ? `${ep.show.title} — ${ep.title}` : ep.title,
        id: ep.id,
        views: ep.playsCount,
        status: ep.status,
        siteHref: `/podcast/${ep.id}`,
      })),
    ].sort((a, b) => b.views - a.views);

    const payouts = await this.prisma.creatorPayout.findMany({
      where: { creatorId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const giftsReceived = await this.prisma.gift.findMany({
      where: { receiverId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        sender: { select: { username: true } },
        catalog: { select: { name: true, coinCost: true } },
      },
    });

    const credits = await this.prisma.creatorBalanceLedger.aggregate({
      where: { creatorId: id, entryType: CreatorBalanceEntryType.credit },
      _sum: { amountUsd: true },
    });
    const debits = await this.prisma.creatorBalanceLedger.aggregate({
      where: { creatorId: id, entryType: CreatorBalanceEntryType.debit },
      _sum: { amountUsd: true },
    });
    const credit = credits._sum.amountUsd ?? new Prisma.Decimal(0);
    const debit = debits._sum.amountUsd ?? new Prisma.Decimal(0);
    const available = credit.minus(debit);
    const balanceUsd = available.gt(0) ? available : new Prisma.Decimal(0);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      streamerStatus: user.streamerStatus,
      verticalCreatorStatus: user.verticalCreatorStatus,
      storeCreatorStatus: user.storeCreatorStatus,
      partnerTier: user.partnerTier,
      coins: user.coinsBalance,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      premiumTier: user.premiumTier,
      gender: user.gender,
      birthDate: user.birthDate
        ? user.birthDate.toISOString().slice(0, 10)
        : null,
      joinedAt: user.createdAt.toISOString().slice(0, 10),
      socialLinks: user.socialLinks.map((l) => ({
        label: l.label,
        url: l.url,
      })),
      counts: {
        videos: user._count.videos,
        followers: user._count.followers,
        following: user._count.following,
        streams: user._count.streams,
        podcastShows: user._count.podcastShows,
        verticalSeries: user._count.verticalSeries,
        reportsFiled: user._count.reportsFiled,
      },
      verticalSeries: verticalSeries.map((s) => ({
        slug: s.slug,
        title: s.title,
        status: s.status,
        episodeCount: s.totalEpisodes,
        siteHref: `/verticals/${s.slug}`,
      })),
      content,
      payoutProfile: user.payoutProfile
        ? {
            method: user.payoutProfile.method,
            details: user.payoutProfile.detailsJson as Record<string, string>,
            updatedAt: user.payoutProfile.updatedAt.toISOString(),
          }
        : null,
      financial: {
        balanceUsd: Number(balanceUsd),
        lifetimeEarningsUsd: Number(balance._sum.amountUsd ?? 0),
        coins: user.coinsBalance,
        payouts: payouts.map((p) => ({
          id: p.id,
          amountUsd: Number(p.amountUsd),
          method: p.method,
          status: p.status,
          payoutDetails: (p.payoutDetailsJson ?? null) as Record<
            string,
            string
          > | null,
          date: p.createdAt.toISOString().slice(0, 10),
        })),
        giftsReceived: giftsReceived.map((g) => ({
          gift: g.catalog.name,
          from: `@${g.sender.username}`,
          coins: g.catalog.coinCost,
          date: g.createdAt.toISOString().slice(0, 10),
        })),
      },
      reports: {
        filed: await Promise.all(
          reportsFiled.map(async (r) => ({
            id: r.id,
            target: await this.resolveTargetTitle(r.targetType, r.targetId),
            reason: r.reason,
            status: r.status,
            date: r.createdAt.toISOString().slice(0, 10),
          })),
        ),
        received: await Promise.all(
          reportsReceived.map(async (r) => ({
            id: r.id,
            target: await this.resolveTargetTitle(r.targetType, r.targetId),
            reason: r.reason,
            status: r.status,
            date: r.createdAt.toISOString().slice(0, 10),
          })),
        ),
      },
      streamerApplication: user.streamerApplication,
      verticalCreatorApplication: user.verticalCreatorApplication,
      storeCreatorApplication: user.storeCreatorApplication,
      storeProducts:
        user.creatorStore?.products.map((p) => ({
          id: p.id,
          title: p.title,
          productType: p.productType,
          priceUsd: Number(p.priceUsd),
          status: p.status,
          imageUrl: p.imageUrl,
          inventory: p.inventory,
          createdAt: p.createdAt.toISOString(),
        })) ?? [],
    };
  }

  async setUserBanned(id: string, banned: boolean) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isBanned: banned },
      select: { id: true, isBanned: true },
    });
    return { success: true, user };
  }

  async setUserVerified(id: string, verified: boolean) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isVerified: verified },
      select: { id: true, isVerified: true },
    });
    return { success: true, user };
  }

  async setPartnerTier(id: string, partnerTier: CreatorPartnerTier) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { partnerTier },
      select: { id: true, partnerTier: true },
    });
    return { success: true, user };
  }

  async adjustUserCoins(id: string, delta: number) {
    if (!Number.isInteger(delta) || delta === 0) {
      throw new BadRequestException('delta must be a non-zero integer');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const next = user.coinsBalance + delta;
    if (next < 0) throw new BadRequestException('Insufficient coins');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { coinsBalance: next },
      select: { id: true, coinsBalance: true },
    });
    return { success: true, coins: updated.coinsBalance };
  }

  async listStreamerApplications(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.StreamerApplicationWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as ApplicationStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.streamerApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.streamerApplication.count({ where }),
    ]);

    return {
      items: items.map((a) => ({
        id: a.id,
        userId: a.userId,
        username: a.user.username,
        displayName: a.user.displayName,
        description: a.description,
        status: a.status,
        submittedAt: a.createdAt.toISOString(),
        hasIdDocument: !!a.idDocumentUrl,
        idDocumentUrl: a.idDocumentUrl,
      })),
      meta: { page, limit, total },
    };
  }

  async getStreamerApplication(id: string) {
    const app = await this.prisma.streamerApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            streamerStatus: true,
          },
        },
        reviewedBy: { select: { username: true } },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return {
      id: app.id,
      userId: app.userId,
      username: app.user.username,
      displayName: app.user.displayName,
      email: app.user.email,
      avatarUrl: app.user.avatarUrl,
      streamerStatus: app.user.streamerStatus,
      description: app.description,
      idDocumentUrl: app.idDocumentUrl,
      status: app.status,
      reviewNotes: app.reviewNotes,
      reviewedBy: app.reviewedBy?.username ?? null,
      submittedAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }

  async reviewStreamerApplication(
    id: string,
    adminId: string,
    action: StreamerApplicationAction,
    notes?: string,
  ) {
    const app = await this.prisma.streamerApplication.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    const approved = action === StreamerApplicationAction.approve;
    const appStatus = approved ? ApplicationStatus.approved : ApplicationStatus.rejected;
    const streamerStatus = approved
      ? StreamerStatus.approved
      : StreamerStatus.rejected;

    await this.prisma.$transaction([
      this.prisma.streamerApplication.update({
        where: { id },
        data: {
          status: appStatus,
          reviewedById: adminId,
          reviewNotes: notes?.trim() || null,
        },
      }),
      this.prisma.user.update({
        where: { id: app.userId },
        data: { streamerStatus },
      }),
    ]);

    return { success: true, status: appStatus, streamerStatus };
  }

  async listVerticalCreatorApplications(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.VerticalCreatorApplicationWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as ApplicationStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.verticalCreatorApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.verticalCreatorApplication.count({ where }),
    ]);

    return {
      items: items.map((a) => ({
        id: a.id,
        userId: a.userId,
        username: a.user.username,
        displayName: a.user.displayName,
        description: a.description,
        portfolioUrl: a.portfolioUrl,
        status: a.status,
        submittedAt: a.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async getVerticalCreatorApplication(id: string) {
    const app = await this.prisma.verticalCreatorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            verticalCreatorStatus: true,
          },
        },
        reviewedBy: { select: { username: true } },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return {
      id: app.id,
      userId: app.userId,
      username: app.user.username,
      displayName: app.user.displayName,
      email: app.user.email,
      avatarUrl: app.user.avatarUrl,
      verticalCreatorStatus: app.user.verticalCreatorStatus,
      description: app.description,
      idDocumentUrl: app.idDocumentUrl,
      portfolioUrl: app.portfolioUrl,
      status: app.status,
      reviewNotes: app.reviewNotes,
      reviewedBy: app.reviewedBy?.username ?? null,
      submittedAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }

  async reviewVerticalCreatorApplication(
    id: string,
    adminId: string,
    action: VerticalCreatorApplicationAction,
    notes?: string,
  ) {
    const app = await this.prisma.verticalCreatorApplication.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    const approved = action === VerticalCreatorApplicationAction.approve;
    const appStatus = approved ? ApplicationStatus.approved : ApplicationStatus.rejected;
    const verticalCreatorStatus = approved
      ? VerticalCreatorStatus.approved
      : VerticalCreatorStatus.rejected;

    await this.prisma.$transaction([
      this.prisma.verticalCreatorApplication.update({
        where: { id },
        data: {
          status: appStatus,
          reviewedById: adminId,
          reviewNotes: notes?.trim() || null,
        },
      }),
      this.prisma.user.update({
        where: { id: app.userId },
        data: { verticalCreatorStatus },
      }),
    ]);

    return { success: true, status: appStatus, verticalCreatorStatus };
  }

  async listStoreProducts(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.StoreProductWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as StoreProductStatus;
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { store: { creator: { username: { contains: q, mode: 'insensitive' } } } },
        { store: { displayName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.storeProduct.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          store: {
            include: {
              creator: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.storeProduct.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        productType: p.productType,
        priceUsd: Number(p.priceUsd),
        status: p.status,
        imageUrl: p.imageUrl,
        inventory: p.inventory,
        createdAt: p.createdAt.toISOString(),
        creatorId: p.store.creator.id,
        creatorUsername: p.store.creator.username,
        creatorDisplayName: p.store.creator.displayName,
        storeSlug: p.store.slug,
      })),
      meta: { page, limit, total },
    };
  }

  async getStoreCreatorApplication(id: string) {
    const app = await this.prisma.storeCreatorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            storeCreatorStatus: true,
          },
        },
      },
    });
    if (!app) throw new NotFoundException('Application not found');

    return {
      id: app.id,
      type: 'store' as const,
      userId: app.userId,
      username: app.user.username,
      displayName: app.user.displayName,
      email: app.user.email,
      storeCreatorStatus: app.user.storeCreatorStatus,
      description: app.description,
      status: app.status,
      hasIdDocument: !!app.idDocumentUrl,
      acceptedTerms: app.acceptedTerms,
      reviewNotes: app.reviewNotes,
      submittedAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }

  async reviewStoreCreatorApplication(
    id: string,
    adminId: string,
    action: StoreCreatorApplicationAction,
    notes?: string,
  ) {
    const app = await this.prisma.storeCreatorApplication.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    const approved = action === StoreCreatorApplicationAction.approve;
    const appStatus = approved ? ApplicationStatus.approved : ApplicationStatus.rejected;
    const storeCreatorStatus = approved
      ? StoreCreatorStatus.approved
      : StoreCreatorStatus.rejected;

    await this.prisma.$transaction([
      this.prisma.storeCreatorApplication.update({
        where: { id },
        data: {
          status: appStatus,
          reviewedById: adminId,
          reviewNotes: notes?.trim() || null,
        },
      }),
      this.prisma.user.update({
        where: { id: app.userId },
        data: { storeCreatorStatus },
      }),
    ]);

    if (approved) {
      const baseSlug = app.user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      await this.prisma.creatorStore.upsert({
        where: { creatorId: app.userId },
        create: {
          creatorId: app.userId,
          slug: baseSlug,
          displayName: app.user.displayName?.trim() || app.user.username,
          isPublished: true,
        },
        update: { isPublished: true },
      });
    }

    return { success: true, status: appStatus, storeCreatorStatus };
  }

  async listPayouts(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.CreatorPayoutWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as PayoutStatus;
    }
    const createdAt = createdAtFilter(query);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      this.prisma.creatorPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          creator: { select: { username: true } },
        },
      }),
      this.prisma.creatorPayout.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        creator: `@${p.creator.username}`,
        creatorId: p.creatorId,
        amountUsd: Number(p.amountUsd),
        method: p.method,
        payoutDetails: (p.payoutDetailsJson ?? null) as Record<
          string,
          string
        > | null,
        status: p.status,
        taxStatus: 'not_submitted',
        createdAt: p.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async processPayout(id: string, adminId: string, action: AdminPayoutAction) {
    const payout = await this.prisma.creatorPayout.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException('Payout not found');

    if (action === AdminPayoutAction.processing) {
      const updated = await this.prisma.creatorPayout.update({
        where: { id },
        data: { status: PayoutStatus.processing, processedById: adminId },
      });
      return { success: true, payout: updated };
    }

    if (action === AdminPayoutAction.complete) {
      const updated = await this.prisma.creatorPayout.update({
        where: { id },
        data: { status: PayoutStatus.completed, processedById: adminId },
      });
      return { success: true, payout: updated };
    }

    if (action === AdminPayoutAction.reject) {
      if (
        payout.status === PayoutStatus.completed ||
        payout.status === PayoutStatus.rejected
      ) {
        throw new BadRequestException('Payout cannot be rejected');
      }
      await this.prisma.$transaction([
        this.prisma.creatorPayout.update({
          where: { id },
          data: { status: PayoutStatus.rejected, processedById: adminId },
        }),
        this.prisma.creatorBalanceLedger.create({
          data: {
            creatorId: payout.creatorId,
            entryType: CreatorBalanceEntryType.credit,
            amountUsd: payout.amountUsd,
            description: `Payout rejected ${id}`,
          },
        }),
      ]);
      return { success: true, status: PayoutStatus.rejected };
    }

    throw new BadRequestException('Invalid action');
  }

  async listLiveStreams() {
    const streams = await this.prisma.stream.findMany({
      where: { status: StreamStatus.live },
      orderBy: { viewerCount: 'desc' },
      include: {
        creator: { select: { username: true } },
      },
    });
    return {
      items: streams.map((s) => ({
        id: s.id,
        title: s.title,
        creator: `@${s.creator.username}`,
        viewers: s.viewerCount,
        category: s.category ?? 'Live',
        startedAt: s.startedAt?.toISOString() ?? s.createdAt.toISOString(),
      })),
    };
  }

  async killStream(id: string) {
    const stream = await this.prisma.stream.findUnique({ where: { id } });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.status !== StreamStatus.live) {
      throw new BadRequestException('Stream is not live');
    }
    await this.prisma.stream.update({
      where: { id },
      data: { status: StreamStatus.ended, endedAt: new Date() },
    });
    return { success: true };
  }

  async listStreamHistory(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.StreamWhereInput = { status: StreamStatus.ended };
    const endedAt = createdAtFilter(query);
    if (endedAt) where.endedAt = endedAt;

    const [items, total] = await Promise.all([
      this.prisma.stream.findMany({
        where,
        orderBy: { endedAt: 'desc' },
        skip,
        take,
        include: { creator: { select: { username: true } } },
      }),
      this.prisma.stream.count({ where }),
    ]);

    return {
      items: items.map((s) => {
        const started = s.startedAt ?? s.createdAt;
        const ended = s.endedAt ?? s.createdAt;
        const durationMs = Math.max(0, ended.getTime() - started.getTime());
        const minutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(minutes / 60);
        const duration =
          hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
        return {
          id: s.id,
          title: s.title,
          creator: `@${s.creator.username}`,
          duration,
          endedAt: ended.toISOString(),
          status: s.status,
        };
      }),
      meta: { page, limit, total },
    };
  }

  async listRevenueLedger(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.RevenueLedgerBatchWhereInput = {};
    const createdAt = createdAtFilter(query);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      this.prisma.revenueLedgerBatch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          ruleKey: true,
          sourceType: true,
          grossAmountUsd: true,
          creatorId: true,
          createdAt: true,
        },
      }),
      this.prisma.revenueLedgerBatch.count({ where }),
    ]);

    return {
      items: items.map((b) => ({
        id: b.id,
        ruleKey: b.ruleKey,
        sourceType: b.sourceType,
        grossUsd: Number(b.grossAmountUsd),
        creatorId: b.creatorId,
        createdAt: b.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async getAnalyticsTimeseries(query: AdminDateRangeInput = {}) {
    const { start, end, label, buckets } = resolveAdminDateRange(query);

    const [
      analyticsEvents,
      signups,
      revenueBatches,
      endedStreams,
      premiumSubscribers,
    ] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          userId: { not: null },
        },
        select: { userId: true, createdAt: true },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      this.prisma.revenueLedgerBatch.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { createdAt: true, sourceType: true, grossAmountUsd: true },
      }),
      this.prisma.stream.findMany({
        where: { endedAt: { gte: start, lte: end } },
        select: { startedAt: true, endedAt: true, createdAt: true },
      }),
      this.prisma.user.count({
        where: { premiumExpiresAt: { gt: new Date() } },
      }),
    ]);

    const topContent = await this.topContentInPeriod(start, 8, end);

    const dauByDay = new Map<string, Set<string>>();
    for (const b of buckets) dauByDay.set(b, new Set());
    for (const e of analyticsEvents) {
      if (!e.userId) continue;
      const key = this.dateKey(e.createdAt);
      dauByDay.get(key)?.add(e.userId);
    }

    const signupsByDay = new Map(buckets.map((b) => [b, 0]));
    for (const u of signups) {
      const key = this.dateKey(u.createdAt);
      if (signupsByDay.has(key)) {
        signupsByDay.set(key, (signupsByDay.get(key) ?? 0) + 1);
      }
    }

    const revenueByDay = new Map(buckets.map((b) => [b, 0]));
    const revenueSourceTotals = new Map<string, number>();
    for (const batch of revenueBatches) {
      const key = this.dateKey(batch.createdAt);
      const usd = Number(batch.grossAmountUsd);
      if (revenueByDay.has(key)) {
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + usd);
      }
      const src = String(batch.sourceType);
      revenueSourceTotals.set(src, (revenueSourceTotals.get(src) ?? 0) + usd);
    }

    const liveHoursByDay = new Map(buckets.map((b) => [b, 0]));
    for (const s of endedStreams) {
      const ended = s.endedAt ?? s.createdAt;
      const started = s.startedAt ?? s.createdAt;
      const hours = Math.max(0, ended.getTime() - started.getTime()) / 3_600_000;
      const key = this.dateKey(ended);
      if (liveHoursByDay.has(key)) {
        liveHoursByDay.set(key, (liveHoursByDay.get(key) ?? 0) + hours);
      }
    }

    return {
      range: label,
      dateFrom: buckets[0],
      dateTo: buckets[buckets.length - 1],
      buckets,
      series: {
        dau: buckets.map((b) => dauByDay.get(b)?.size ?? 0),
        signups: buckets.map((b) => signupsByDay.get(b) ?? 0),
        revenueUsd: buckets.map((b) =>
          Math.round((revenueByDay.get(b) ?? 0) * 100) / 100,
        ),
        liveHours: buckets.map((b) =>
          Math.round((liveHoursByDay.get(b) ?? 0) * 10) / 10,
        ),
      },
      revenueBySource: [...revenueSourceTotals.entries()]
        .map(([sourceType, totalUsd]) => ({
          sourceType,
          totalUsd: Math.round(totalUsd * 100) / 100,
        }))
        .sort((a, b) => b.totalUsd - a.totalUsd),
      topContent,
      premiumSubscribers,
    };
  }

  async getUserImpact(creatorId: string, periodMonth?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const period = this.parsePeriodMonth(periodMonth);
    const snap = await this.prisma.creatorImpactSnapshot.findUnique({
      where: {
        creatorId_periodMonth: { creatorId, periodMonth: period },
      },
    });

    if (!snap) {
      return {
        periodMonth: period.toISOString().slice(0, 7),
        earningsUsd: 0,
        adRevenueUsd: 0,
        sponsorshipRevenueUsd: 0,
        merchandiseRevenueUsd: 0,
        donationsUsd: 0,
        watchHours: 0,
        retentionRate: null,
        subscriberCount: 0,
        engagementScore: null,
        jobsSupported: 0,
        businessesFunded: 0,
        dollarsInvested: 0,
        workforceOpportunities: 0,
      };
    }

    return {
      periodMonth: snap.periodMonth.toISOString().slice(0, 7),
      earningsUsd: Number(snap.earningsUsd),
      adRevenueUsd: Number(snap.adRevenueUsd),
      sponsorshipRevenueUsd: Number(snap.sponsorshipRevenueUsd),
      merchandiseRevenueUsd: Number(snap.merchandiseRevenueUsd),
      donationsUsd: Number(snap.donationsUsd),
      watchHours: Number(snap.watchHours),
      retentionRate: snap.retentionRate ? Number(snap.retentionRate) : null,
      subscriberCount: snap.subscriberCount,
      engagementScore: snap.engagementScore ? Number(snap.engagementScore) : null,
      jobsSupported: snap.jobsSupported,
      businessesFunded: snap.businessesFunded,
      dollarsInvested: Number(snap.dollarsInvested),
      workforceOpportunities: snap.workforceOpportunities,
    };
  }

  async upsertUserImpact(creatorId: string, body: UpdateUserImpactDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const periodMonth = this.parsePeriodMonth(body.periodMonth);
    const data = {
      earningsUsd: body.earningsUsd,
      adRevenueUsd: body.adRevenueUsd,
      sponsorshipRevenueUsd: body.sponsorshipRevenueUsd,
      merchandiseRevenueUsd: body.merchandiseRevenueUsd,
      donationsUsd: body.donationsUsd,
      watchHours: body.watchHours,
      retentionRate: body.retentionRate,
      subscriberCount: body.subscriberCount,
      engagementScore: body.engagementScore,
      jobsSupported: body.jobsSupported,
      businessesFunded: body.businessesFunded,
      dollarsInvested: body.dollarsInvested,
      workforceOpportunities: body.workforceOpportunities,
    };

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    await this.prisma.creatorImpactSnapshot.upsert({
      where: {
        creatorId_periodMonth: { creatorId, periodMonth },
      },
      create: {
        creatorId,
        periodMonth,
        ...filtered,
      },
      update: filtered,
    });

    return this.getUserImpact(creatorId, body.periodMonth);
  }

  async deleteVideo(id: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');
    try {
      await this.playlists.removeContentReferences('video', id);
      await this.storage.purgeVideoAssets(video);
      await this.prisma.video.delete({ where: { id } });
      return { success: true };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException('Video not found');
    }
  }

  async getAdminVideo(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        cast: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, username: true, displayName: true } },
      },
    });
    if (!video) throw new NotFoundException('Video not found');

    return {
      id: video.id,
      type: video.type,
      title: video.title,
      description: video.description ?? '',
      tagline: video.tagline ?? '',
      category: video.category ?? '',
      director: video.director ?? '',
      writers: video.writers.join(', '),
      releaseYear: video.releaseYear,
      ageRating: video.ageRating ?? '',
      status: video.status,
      posterUrl: video.posterUrl,
      cast: video.cast.map((c) => ({ name: c.name, role: c.role })),
      creatorId: video.creatorId,
      creator: video.creator.displayName ?? video.creator.username,
    };
  }

  async updateAdminVideo(
    id: string,
    body: {
      title?: string;
      description?: string;
      tagline?: string;
      category?: string;
      director?: string;
      writers?: string;
      releaseYear?: number;
      ageRating?: string;
      cast?: Array<{ name: string; role: string }>;
    },
  ) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');

    const writers = body.writers
      ? body.writers
          .split(',')
          .map((w) => w.trim())
          .filter(Boolean)
          .slice(0, 12)
      : undefined;

    const castRows =
      body.cast
        ?.map((c) => ({
          name: c.name.trim(),
          role: c.role.trim(),
        }))
        .filter((c) => c.name && c.role)
        .slice(0, 20) ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.video.update({
        where: { id },
        data: {
          ...(body.title !== undefined ? { title: body.title.trim() } : {}),
          ...(body.description !== undefined
            ? { description: body.description.trim() || null }
            : {}),
          ...(body.tagline !== undefined
            ? { tagline: body.tagline.trim() || null }
            : {}),
          ...(body.category !== undefined
            ? { category: body.category.trim() || null }
            : {}),
          ...(body.director !== undefined
            ? { director: body.director.trim() || null }
            : {}),
          ...(writers !== undefined ? { writers } : {}),
          ...(body.releaseYear !== undefined
            ? { releaseYear: body.releaseYear }
            : {}),
          ...(body.ageRating !== undefined
            ? { ageRating: body.ageRating.trim() || null }
            : {}),
        },
      });

      if (castRows !== null) {
        await tx.videoCast.deleteMany({ where: { videoId: id } });
        if (castRows.length) {
          await tx.videoCast.createMany({
            data: castRows.map((member, index) => ({
              videoId: id,
              name: member.name,
              role: member.role,
              sortOrder: index,
            })),
          });
        }
      }
    });

    return this.getAdminVideo(id);
  }

  async deleteComment(id: string) {
    try {
      await this.prisma.comment.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Comment not found');
    }
  }

  async listAdminVideos(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.VideoWhereInput = {};

    if (query.type && query.type !== 'all') {
      where.type = query.type as VideoType;
    }
    if (query.status && query.status !== 'all') {
      where.status = query.status as ContentStatus;
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { creator: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          creator: { select: { id: true, username: true } },
        },
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      items: items.map((v) => ({
        id: v.id,
        title: v.title,
        type: v.type,
        creatorId: v.creatorId,
        creator: `@${v.creator.username}`,
        views: v.viewsCount,
        likes: v.likesCount,
        comments: v.commentsCount,
        status: v.status === ContentStatus.ready ? 'published' : v.status,
        category: v.category ?? 'General',
        uploadedAt: v.createdAt.toISOString(),
        siteHref:
          v.type === VideoType.movie
            ? `/movie/${v.id}`
            : v.type === VideoType.short
              ? `/shorts/${v.id}`
              : `/watch/${v.id}`,
      })),
      meta: { page, limit, total },
    };
  }

  async listAdminComments(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.CommentWhereInput = {};

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { body: { contains: q, mode: 'insensitive' } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { username: true } },
          video: { select: { title: true } },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        body: c.body,
        author: `@${c.user.username}`,
        targetType: 'video',
        targetTitle: c.video.title,
        targetId: c.videoId,
        likes: c.likesCount,
        reports: 0,
        status: 'visible',
        createdAt: c.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async getContentStats() {
    const [
      videos,
      shorts,
      movies,
      verticalSeries,
      verticalEpisodes,
      podcastShows,
      podcastEpisodes,
      comments,
      viewsAgg,
    ] = await Promise.all([
      this.prisma.video.count({ where: { type: VideoType.video } }),
      this.prisma.video.count({ where: { type: VideoType.short } }),
      this.prisma.video.count({ where: { type: VideoType.movie } }),
      this.prisma.verticalSeries.count(),
      this.prisma.verticalEpisode.count(),
      this.prisma.podcastShow.count(),
      this.prisma.podcastEpisode.count(),
      this.prisma.comment.count(),
      this.prisma.video.aggregate({ _sum: { viewsCount: true } }),
    ]);
    return {
      videos,
      shorts,
      movies,
      verticalSeries,
      verticalEpisodes,
      podcastShows,
      podcastEpisodes,
      comments,
      totalViews: viewsAgg._sum.viewsCount ?? 0,
    };
  }

  async listAdminVerticalSeries(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.VerticalSeriesWhereInput = {};
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { creator: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.verticalSeries.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          creator: { select: { id: true, username: true } },
          _count: { select: { episodes: true } },
          episodes: { select: { viewsCount: true } },
        },
      }),
      this.prisma.verticalSeries.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        slug: s.slug,
        title: s.title,
        creatorId: s.creatorId,
        creator: s.creator ? `@${s.creator.username}` : '—',
        episodeCount: s._count.episodes,
        totalViews: s.episodes.reduce((sum, e) => sum + e.viewsCount, 0),
        status: s.status,
        vertical: s.genre ?? 'vertical',
      })),
      meta: { page, limit, total },
    };
  }

  async listAdminVerticalEpisodes(slug: string, query: AdminListQueryDto) {
    const series = await this.prisma.verticalSeries.findUnique({
      where: { slug },
      include: { creator: { select: { username: true } } },
    });
    if (!series) throw new NotFoundException('Series not found');

    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const [episodes, total] = await Promise.all([
      this.prisma.verticalEpisode.findMany({
        where: { seriesId: series.id },
        orderBy: { episodeNumber: 'asc' },
        skip,
        take,
      }),
      this.prisma.verticalEpisode.count({ where: { seriesId: series.id } }),
    ]);

    return {
      series: {
        slug: series.slug,
        title: series.title,
        creator: series.creator ? `@${series.creator.username}` : '—',
        episodeCount: total,
      },
      items: episodes.map((ep) => ({
        id: ep.id,
        title: ep.title,
        episodeNumber: ep.episodeNumber,
        views: ep.viewsCount,
        likes: ep.likesCount,
        comments: 0,
        status: ep.status === ContentStatus.ready ? 'published' : ep.status,
        uploadedAt: ep.createdAt.toISOString(),
        siteHref: `/verticals/watch/${series.slug}/${ep.episodeNumber}`,
      })),
      meta: { page, limit, total },
    };
  }

  async listAdminPodcastShows(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.PodcastShowWhereInput = {};
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { creator: { username: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.podcastShow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          creator: { select: { id: true, username: true } },
          _count: { select: { episodes: true } },
        },
      }),
      this.prisma.podcastShow.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        id: s.id,
        title: s.title,
        creatorId: s.creatorId,
        creator: `@${s.creator.username}`,
        episodeCount: s._count.episodes,
        subscribers: s.followersCount,
        status: 'published',
      })),
      meta: { page, limit, total },
    };
  }

  async listAdminPodcastEpisodes(showId: string, query: AdminListQueryDto) {
    const show = await this.prisma.podcastShow.findUnique({
      where: { id: showId },
      include: {
        creator: { select: { username: true } },
        _count: { select: { episodes: true } },
      },
    });
    if (!show) throw new NotFoundException('Podcast show not found');

    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const [episodes, total] = await Promise.all([
      this.prisma.podcastEpisode.findMany({
        where: { showId },
        orderBy: { publishedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.podcastEpisode.count({ where: { showId } }),
    ]);

    return {
      show: {
        id: show.id,
        title: show.title,
        creator: `@${show.creator.username}`,
        episodeCount: show._count.episodes,
      },
      items: episodes.map((ep) => ({
        id: ep.id,
        title: ep.title,
        durationMin: Math.round(ep.durationSeconds / 60),
        plays: ep.playsCount,
        likes: ep.likesCount,
        comments: 0,
        status: ep.status === ContentStatus.ready ? 'published' : ep.status,
        publishedAt: (ep.publishedAt ?? ep.createdAt).toISOString(),
        siteHref: `/podcast/${ep.id}`,
      })),
      meta: { page, limit, total },
    };
  }

  async getAdminVerticalSeries(slug: string) {
    const series = await this.prisma.verticalSeries.findUnique({
      where: { slug },
      include: { creator: { select: { username: true, displayName: true } } },
    });
    if (!series) throw new NotFoundException('Series not found');

    return {
      slug: series.slug,
      title: series.title,
      tagline: series.tagline ?? '',
      description: series.description ?? '',
      genre: series.genre ?? '',
      status: series.status,
      creator: series.creator
        ? (series.creator.displayName ?? series.creator.username)
        : '—',
      siteHref: `/verticals/${series.slug}`,
    };
  }

  async updateAdminVerticalSeries(
    slug: string,
    body: {
      title?: string;
      tagline?: string;
      description?: string;
      genre?: string;
    },
  ) {
    const series = await this.prisma.verticalSeries.findUnique({ where: { slug } });
    if (!series) throw new NotFoundException('Series not found');

    await this.prisma.verticalSeries.update({
      where: { slug },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.tagline !== undefined
          ? { tagline: body.tagline.trim() || null }
          : {}),
        ...(body.description !== undefined
          ? { description: body.description.trim() || null }
          : {}),
        ...(body.genre !== undefined ? { genre: body.genre.trim() || null } : {}),
      },
    });

    return this.getAdminVerticalSeries(slug);
  }

  async getAdminVerticalEpisode(id: string) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id },
      include: {
        series: { select: { slug: true, title: true } },
      },
    });
    if (!episode) throw new NotFoundException('Episode not found');

    return {
      id: episode.id,
      seriesSlug: episode.series.slug,
      seriesTitle: episode.series.title,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      description: episode.description ?? '',
      cliffhanger: episode.cliffhanger ?? '',
      status: episode.status,
      siteHref: `/verticals/watch/${episode.series.slug}/${episode.episodeNumber}`,
    };
  }

  async updateAdminVerticalEpisode(
    id: string,
    body: {
      episodeNumber?: number;
      title?: string;
      description?: string;
      cliffhanger?: string;
    },
  ) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id },
      include: { series: { select: { slug: true } } },
    });
    if (!episode) throw new NotFoundException('Episode not found');

    if (
      body.episodeNumber != null &&
      body.episodeNumber !== episode.episodeNumber
    ) {
      const conflict = await this.prisma.verticalEpisode.findFirst({
        where: {
          seriesId: episode.seriesId,
          episodeNumber: body.episodeNumber,
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException(
          `Episode ${body.episodeNumber} already exists in this series`,
        );
      }
    }

    await this.prisma.verticalEpisode.update({
      where: { id },
      data: {
        ...(body.episodeNumber !== undefined
          ? { episodeNumber: body.episodeNumber }
          : {}),
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description.trim() || null }
          : {}),
        ...(body.cliffhanger !== undefined
          ? { cliffhanger: body.cliffhanger.trim() || null }
          : {}),
      },
    });

    return this.getAdminVerticalEpisode(id);
  }

  async getAdminPodcastEpisode(id: string) {
    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id },
      include: {
        show: { select: { id: true, title: true } },
      },
    });
    if (!episode) throw new NotFoundException('Episode not found');

    return {
      id: episode.id,
      showId: episode.showId,
      showTitle: episode.show.title,
      title: episode.title,
      description: episode.description ?? '',
      status: episode.status,
      siteHref: `/podcast/${episode.id}`,
    };
  }

  async updateAdminPodcastEpisode(
    id: string,
    body: { title?: string; description?: string },
  ) {
    const episode = await this.prisma.podcastEpisode.findUnique({ where: { id } });
    if (!episode) throw new NotFoundException('Episode not found');

    await this.prisma.podcastEpisode.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description.trim() || null }
          : {}),
      },
    });

    return this.getAdminPodcastEpisode(id);
  }

  async deleteVerticalEpisode(id: string) {
    const episode = await this.prisma.verticalEpisode.findUnique({
      where: { id },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    try {
      await this.storage.purgePublicMediaUrl(episode.videoUrl);
      await this.storage.purgePublicMediaUrl(episode.thumbnailUrl);
      await this.prisma.verticalEpisode.delete({ where: { id } });
      return { success: true };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException('Episode not found');
    }
  }

  async deletePodcastEpisode(id: string) {
    const episode = await this.prisma.podcastEpisode.findUnique({
      where: { id },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    try {
      await this.playlists.removeContentReferences('podcast_episode', id);
      await this.storage.purgePodcastEpisodeAssets(episode);
      await this.prisma.podcastEpisode.delete({ where: { id } });
      return { success: true };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException('Episode not found');
    }
  }

  async getEconomyConfig() {
    const [economy, coinPackages, gifts] = await Promise.all([
      this.platformSettings.getEconomy(),
      this.prisma.coinPackage.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.giftCatalog.findMany({ orderBy: { id: 'asc' } }),
    ]);

    return {
      ...economy,
      coinPackages: coinPackages.map((p) => ({
        id: p.id,
        label: p.label,
        coins: p.coins,
        priceUsd: Number(p.priceUsd),
        isActive: p.isActive,
        sortOrder: p.sortOrder,
      })),
      gifts: gifts.map((g) => ({
        id: g.id,
        name: g.name,
        coinCost: g.coinCost,
        animationKey: g.animationKey,
        imageUrl: g.imageUrl,
        isActive: g.isActive,
      })),
    };
  }

  async updateEconomyConfig(adminId: string, body: UpdateEconomyConfigDto) {
    const current = await this.platformSettings.getEconomy();
    const next = await this.platformSettings.setEconomy(body, adminId);
    if (body.coinUsd != null && body.coinUsd !== current.coinUsd) {
      const packages = await this.prisma.coinPackage.findMany();
      await Promise.all(
        packages.map((p) =>
          this.prisma.coinPackage.update({
            where: { id: p.id },
            data: {
              priceUsd: packagePriceFromCoins(p.coins, next.coinUsd),
            },
          }),
        ),
      );
    }
    return next;
  }

  getAdsConfig() {
    return this.platformSettings.getAds();
  }

  updateAdsConfig(adminId: string, body: UpdateAdsConfigDto) {
    return this.platformSettings.setAds(body as Partial<AdsSettings>, adminId);
  }

  getAnalyticsConfig() {
    return this.platformSettings.getAnalytics();
  }

  updateAnalyticsConfig(adminId: string, body: UpdateAnalyticsConfigDto) {
    return this.platformSettings.setAnalytics(body as Partial<AnalyticsSettings>, adminId);
  }

  getScorecardConfig() {
    return this.platformSettings.getScorecard();
  }

  updateScorecardConfig(adminId: string, body: UpdateScorecardConfigDto) {
    return this.platformSettings.setScorecard(body as Partial<ScorecardSettings>, adminId);
  }

  getProgramsConfig() {
    return this.platformSettings.getPrograms();
  }

  updateProgramsConfig(adminId: string, programs: ProgramConfigEntry[]) {
    this.validateProgramEntries(programs);
    return this.platformSettings.setPrograms(programs, adminId);
  }

  getPodcastCategoriesConfig() {
    return this.platformSettings.getPodcastCategories();
  }

  updatePodcastCategoriesConfig(
    adminId: string,
    categories: CategoryConfigEntry[],
  ) {
    this.validateCategoryEntries(categories, 'Podcast categories');
    return this.platformSettings.setPodcastCategories(categories, adminId);
  }

  getMovieGenresConfig() {
    return this.platformSettings.getMovieGenres();
  }

  updateMovieGenresConfig(adminId: string, genres: CategoryConfigEntry[]) {
    this.validateCategoryEntries(genres, 'Movie genres');
    return this.platformSettings.setMovieGenres(genres, adminId);
  }

  private validateCategoryEntries(
    entries: CategoryConfigEntry[],
    label: string,
  ) {
    const slugs = new Set<string>();
    for (const entry of entries) {
      const slug = entry.slug?.trim().toLowerCase();
      const entryLabel = entry.label?.trim();
      if (!slug || !entryLabel) {
        throw new BadRequestException(`${label}: slug and label are required`);
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new BadRequestException(
          `${label}: invalid slug "${slug}" (use lowercase letters, numbers, hyphens)`,
        );
      }
      if (slugs.has(slug)) {
        throw new BadRequestException(`${label}: duplicate slug "${slug}"`);
      }
      slugs.add(slug);
    }
  }

  private validateProgramEntries(programs: ProgramConfigEntry[]) {
    const slugs = new Set<string>();
    const validVerticals = new Set<string>(Object.values(ContentVertical));

    for (const program of programs) {
      const slug = program.slug?.trim().toLowerCase();
      const label = program.label?.trim();
      if (!slug || !label) {
        throw new BadRequestException('Video categories: slug and label are required');
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new BadRequestException(
          `Video categories: invalid slug "${slug}"`,
        );
      }
      if (slugs.has(slug)) {
        throw new BadRequestException(`Video categories: duplicate slug "${slug}"`);
      }
      slugs.add(slug);

      if (!validVerticals.has(program.vertical)) {
        throw new BadRequestException(
          `Video categories: invalid vertical for "${slug}"`,
        );
      }
    }
  }

  async upsertCoinPackage(body: UpsertCoinPackageDto) {
    const economy = await this.platformSettings.getEconomy();
    const priceUsd = packagePriceFromCoins(body.coins, economy.coinUsd);
    const row = await this.prisma.coinPackage.upsert({
      where: { id: body.id },
      create: {
        id: body.id,
        coins: body.coins,
        priceUsd,
        label: body.label,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
      update: {
        coins: body.coins,
        priceUsd,
        label: body.label,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return {
      id: row.id,
      label: row.label,
      coins: row.coins,
      priceUsd: Number(row.priceUsd),
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    };
  }

  async deleteCoinPackage(id: string) {
    try {
      await this.prisma.coinPackage.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Coin package not found');
    }
  }

  async upsertGiftCatalog(body: UpsertGiftCatalogDto) {
    const animationKey = body.animationKey?.trim() || body.id;
    const imageUrl =
      body.imageUrl === undefined
        ? undefined
        : body.imageUrl?.trim()
          ? body.imageUrl.trim()
          : null;
    const row = await this.prisma.giftCatalog.upsert({
      where: { id: body.id },
      create: {
        id: body.id,
        name: body.name,
        coinCost: body.coinCost,
        animationKey,
        imageUrl: imageUrl ?? null,
        isActive: body.isActive ?? true,
      },
      update: {
        name: body.name,
        coinCost: body.coinCost,
        animationKey,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        isActive: body.isActive ?? true,
      },
    });
    return {
      id: row.id,
      name: row.name,
      coinCost: row.coinCost,
      animationKey: row.animationKey,
      imageUrl: row.imageUrl,
      isActive: row.isActive,
    };
  }

  async deleteGiftCatalog(id: string) {
    const inUse = await this.prisma.gift.count({ where: { giftType: id } });
    if (inUse > 0) {
      await this.prisma.giftCatalog.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true, deactivated: true };
    }
    try {
      await this.prisma.giftCatalog.delete({ where: { id } });
      return { success: true, deactivated: false };
    } catch {
      throw new NotFoundException('Gift not found');
    }
  }

  async listGiftActivity(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.GiftWhereInput = {};
    const createdAt = createdAtFilter(query);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      this.prisma.gift.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          sender: { select: { username: true } },
          receiver: { select: { username: true } },
          catalog: { select: { name: true, coinCost: true } },
          stream: { select: { title: true } },
          video: { select: { title: true, type: true } },
        },
      }),
      this.prisma.gift.count({ where }),
    ]);

    return {
      items: items.map((g) => ({
        id: g.id,
        giftName: g.catalog.name,
        coinCost: g.catalog.coinCost,
        sender: `@${g.sender.username}`,
        recipient: `@${g.receiver.username}`,
        context: g.streamId ? 'live' : g.video?.type === 'short' ? 'short' : 'video',
        contextTitle: g.stream?.title ?? g.video?.title ?? '—',
        createdAt: g.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async listTransactions(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.TransactionWhereInput = {};
    if (query.type && query.type !== 'all') {
      where.type = query.type as Prisma.EnumTransactionTypeFilter['equals'];
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.user = { username: { contains: q, mode: 'insensitive' } };
    }
    const createdAt = createdAtFilter(query);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { username: true } } },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        type: t.type,
        user: `@${t.user.username}`,
        amountUsd: Number(t.amountUsd),
        coins: t.coinsAdded > 0 ? t.coinsAdded : null,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async listAdCampaigns(query: AdCampaignQueryDto = {}) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.AdCampaignWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.placement) where.placement = query.placement;
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { advertiserName: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.startsAt = {};
      if (query.dateFrom) {
        where.startsAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.endsAt = { lte: new Date(query.dateTo) };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.adCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.adCampaign.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async getAdCampaign(id: string) {
    const campaign = await this.prisma.adCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async getAdCampaignAnalytics(campaignId: string) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const adsConfig = await this.platformSettings.getAds();
    const cpmUsd = adsConfig.impressionRevenueCpmUsd;
    const spentUsd = Number(
      new Prisma.Decimal(cpmUsd).div(1000).mul(campaign.deliveredImpressions),
    );
    const budgetUsd = Number(campaign.budgetUsd);
    const deliveryPct =
      campaign.targetImpressions > 0
        ? (campaign.deliveredImpressions / campaign.targetImpressions) * 100
        : 0;

    const [
      trackedImpressions,
      trackedClicks,
      guestImpressions,
      guestClicks,
      byPlacement,
      recentEvents,
      clickEvents,
    ] = await Promise.all([
      this.prisma.contentAdEvent.count({
        where: { campaignId, eventType: 'ad_impression' },
      }),
      this.prisma.contentAdEvent.count({
        where: { campaignId, eventType: 'ad_click' },
      }),
      this.prisma.contentAdEvent.count({
        where: {
          campaignId,
          eventType: 'ad_impression',
          viewerUserId: null,
        },
      }),
      this.prisma.contentAdEvent.count({
        where: {
          campaignId,
          eventType: 'ad_click',
          viewerUserId: null,
        },
      }),
      this.prisma.contentAdEvent.groupBy({
        by: ['placement', 'eventType'],
        where: { campaignId },
        _count: { _all: true },
      }),
      this.prisma.contentAdEvent.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' },
        take: 40,
        include: {
          creator: { select: { username: true, displayName: true } },
          video: { select: { id: true, title: true } },
        },
      }),
      this.prisma.contentAdEvent.findMany({
        where: { campaignId, eventType: 'ad_click' },
        select: { metadata: true },
      }),
    ]);

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const timelineEvents = await this.prisma.contentAdEvent.findMany({
      where: { campaignId, createdAt: { gte: since } },
      select: { eventType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, { impressions: number; clicks: number }>();
    for (const event of timelineEvents) {
      const key = event.createdAt.toISOString().slice(0, 10);
      const row = byDay.get(key) ?? { impressions: 0, clicks: 0 };
      if (event.eventType === 'ad_impression') row.impressions += 1;
      else if (event.eventType === 'ad_click') row.clicks += 1;
      byDay.set(key, row);
    }

    const placementMap = new Map<
      string,
      { impressions: number; clicks: number }
    >();
    for (const row of byPlacement) {
      const current = placementMap.get(row.placement) ?? {
        impressions: 0,
        clicks: 0,
      };
      if (row.eventType === 'ad_impression') {
        current.impressions += row._count._all;
      } else if (row.eventType === 'ad_click') {
        current.clicks += row._count._all;
      }
      placementMap.set(row.placement, current);
    }

    const servedImpressions = campaign.deliveredImpressions;
    const clickCount = campaign.clicks;

    const byLocationMap = new Map<
      string,
      {
        label: string;
        city: string | null;
        regionName: string | null;
        countryCode: string | null;
        clicks: number;
      }
    >();
    for (const event of clickEvents) {
      const geo = geoFromMetadata(event.metadata);
      const label = geo?.label ?? 'Unknown location';
      const current = byLocationMap.get(label) ?? {
        label,
        city: geo?.city ?? null,
        regionName: geo?.regionName ?? null,
        countryCode: geo?.countryCode ?? null,
        clicks: 0,
      };
      current.clicks += 1;
      byLocationMap.set(label, current);
    }

    return {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        placement: campaign.placement,
        status: campaign.status,
        targetImpressions: campaign.targetImpressions,
        deliveredImpressions: servedImpressions,
        clicks: clickCount,
        budgetUsd,
        spentUsd,
        startsAt: campaign.startsAt.toISOString(),
        endsAt: campaign.endsAt.toISOString(),
      },
      summary: {
        servedImpressions,
        targetImpressions: campaign.targetImpressions,
        deliveryPercent: deliveryPct,
        clicks: clickCount,
        ctrPercent:
          servedImpressions > 0 ? (clickCount / servedImpressions) * 100 : 0,
        trackedImpressions,
        trackedClicks,
        budgetUsd,
        spentUsd,
        budgetRemainingUsd: Math.max(0, budgetUsd - spentUsd),
        cpmUsd,
      },
      byAudience: {
        impressions: {
          guest: guestImpressions,
          loggedIn: trackedImpressions - guestImpressions,
          total: trackedImpressions,
        },
        clicks: {
          guest: guestClicks,
          loggedIn: trackedClicks - guestClicks,
          total: trackedClicks,
        },
      },
      byPlacement: [...placementMap.entries()].map(([placement, counts]) => ({
        placement,
        impressions: counts.impressions,
        clicks: counts.clicks,
        ctrPercent:
          counts.impressions > 0
            ? (counts.clicks / counts.impressions) * 100
            : 0,
      })),
      timeline: [...byDay.entries()].map(([date, counts]) => ({
        date,
        impressions: counts.impressions,
        clicks: counts.clicks,
      })),
      byLocation: [...byLocationMap.values()]
        .sort((a, b) => b.clicks - a.clicks)
        .map((row) => ({
          label: row.label,
          city: row.city,
          regionName: row.regionName,
          countryCode: row.countryCode,
          clicks: row.clicks,
        })),
      recentEvents: recentEvents.map((e) => {
        const geo = geoFromMetadata(e.metadata);
        return {
          id: e.id.toString(),
          eventType: e.eventType,
          placement: e.placement,
          audience: e.viewerUserId ? 'logged_in' : 'guest',
          viewerUserId: e.viewerUserId,
          videoId: e.videoId,
          videoTitle: e.video?.title ?? null,
          creatorName: e.creator.displayName ?? e.creator.username,
          location: geo?.label ?? null,
          city: geo?.city ?? null,
          regionName: geo?.regionName ?? null,
          countryCode: geo?.countryCode ?? null,
          createdAt: e.createdAt.toISOString(),
        };
      }),
    };
  }

  createAdCampaign(dto: CreateAdCampaignDto) {
    return this.prisma.adCampaign.create({
      data: {
        advertiserName: dto.advertiserName,
        title: dto.title,
        mediaUrl: dto.mediaUrl,
        clickThroughUrl: dto.clickThroughUrl,
        placement: dto.placement,
        ...(dto.bannerSize !== undefined && { bannerSize: dto.bannerSize }),
        targetImpressions: dto.targetImpressions,
        budgetUsd: dto.budgetUsd,
        status: dto.status ?? 'active',
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        ...(dto.revenueRuleKey !== undefined && {
          revenueRuleKey: dto.revenueRuleKey,
        }),
        ...(dto.advertiserAccountId && {
          advertiserAccount: { connect: { id: dto.advertiserAccountId } },
        }),
      },
    });
  }

  async updateAdCampaignStatus(id: string, status: AdCampaignStatus) {
    try {
      return await this.prisma.adCampaign.update({
        where: { id },
        data: { status },
      });
    } catch {
      throw new NotFoundException('Campaign not found');
    }
  }

  async updateAdCampaign(
    id: string,
    dto: UpdateAdCampaignDto,
    adminId: string,
  ) {
    const existing = await this.prisma.adCampaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');

    const data: Prisma.AdCampaignUpdateInput = {};
    if (dto.advertiserAccountId !== undefined) {
      data.advertiserAccount = dto.advertiserAccountId
        ? { connect: { id: dto.advertiserAccountId } }
        : { disconnect: true };
    }
    if (dto.advertiserName !== undefined) data.advertiserName = dto.advertiserName.trim();
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.mediaUrl !== undefined) data.mediaUrl = dto.mediaUrl;
    if (dto.clickThroughUrl !== undefined) data.clickThroughUrl = dto.clickThroughUrl;
    if (dto.placement !== undefined) data.placement = dto.placement;
    if (dto.bannerSize !== undefined) data.bannerSize = dto.bannerSize;
    if (dto.targetImpressions !== undefined) data.targetImpressions = dto.targetImpressions;
    if (dto.budgetUsd !== undefined) data.budgetUsd = dto.budgetUsd;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.revenueRuleKey !== undefined) data.revenueRuleKey = dto.revenueRuleKey;

    const updated = await this.prisma.adCampaign.update({
      where: { id },
      data,
    });

    await this.auditLog.log({
      adminId,
      action: 'update',
      entityType: 'ad_campaign',
      entityId: id,
    });

    return updated;
  }

  async duplicateAdCampaign(id: string, adminId: string) {
    const original = await this.prisma.adCampaign.findUnique({ where: { id } });
    if (!original) throw new NotFoundException('Campaign not found');

    const copy = await this.prisma.adCampaign.create({
      data: {
        advertiserAccountId: original.advertiserAccountId,
        revenueRuleKey: original.revenueRuleKey,
        advertiserName: original.advertiserName,
        title: `${original.title} (copy)`,
        mediaUrl: original.mediaUrl,
        clickThroughUrl: original.clickThroughUrl,
        placement: original.placement,
        targetImpressions: original.targetImpressions,
        budgetUsd: original.budgetUsd,
        status: AdCampaignStatus.draft,
        startsAt: original.startsAt,
        endsAt: original.endsAt,
      },
    });

    await this.auditLog.log({
      adminId,
      action: 'duplicate',
      entityType: 'ad_campaign',
      entityId: copy.id,
      metadata: { sourceCampaignId: id },
    });

    return copy;
  }

  async uploadAdMediaInit(body: { mimeType: string; fileName?: string }) {
    if (!body.mimeType?.trim()) {
      throw new BadRequestException('mimeType is required');
    }
    const target = await this.storage.createAdMediaUploadTarget(
      body.mimeType.trim(),
      body.fileName,
    );
    return {
      objectKey: target.objectKey,
      uploadUrl: target.uploadUrl,
      uploadMethod: target.uploadMethod,
      uploadHeaders: target.uploadHeaders,
      expiresIn: target.expiresIn,
      publicUrl: this.storage.getPublicUrl(target.objectKey),
    };
  }

  async uploadGiftImageInit(body: {
    giftId: string;
    mimeType: string;
    fileName?: string;
  }) {
    const giftId = body.giftId?.trim();
    if (!giftId) {
      throw new BadRequestException('giftId is required');
    }
    if (!body.mimeType?.trim()) {
      throw new BadRequestException('mimeType is required');
    }
    this.storage.assertGiftImageMime(body.mimeType.trim());
    const objectKey = this.storage.buildGiftImageKey(giftId, body.fileName);
    const target = await this.storage.createUploadTargetForKey(
      objectKey,
      body.mimeType.trim(),
    );
    return {
      objectKey: target.objectKey,
      uploadUrl: target.uploadUrl,
      uploadMethod: target.uploadMethod,
      uploadHeaders: target.uploadHeaders,
      expiresIn: target.expiresIn,
      publicUrl: this.storage.getPublicUrl(target.objectKey),
    };
  }

  async getAnalyticsRevenue(query: AdminDateRangeInput = {}) {
    const { start, end, label, buckets } = resolveAdminDateRange(query);

    const batches = await this.prisma.revenueLedgerBatch.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, sourceType: true, grossAmountUsd: true },
    });

    const revenueByDay = new Map(buckets.map((b) => [b, 0]));
    const revenueSourceTotals = new Map<string, number>();
    for (const batch of batches) {
      const key = this.dateKey(batch.createdAt);
      const usd = Number(batch.grossAmountUsd);
      if (revenueByDay.has(key)) {
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + usd);
      }
      const src = String(batch.sourceType);
      revenueSourceTotals.set(src, (revenueSourceTotals.get(src) ?? 0) + usd);
    }

    const totalUsd = [...revenueByDay.values()].reduce((s, v) => s + v, 0);

    return {
      range: label,
      dateFrom: buckets[0],
      dateTo: buckets[buckets.length - 1],
      buckets,
      revenueUsd: buckets.map((b) =>
        Math.round((revenueByDay.get(b) ?? 0) * 100) / 100,
      ),
      bySource: [...revenueSourceTotals.entries()]
        .map(([sourceType, amountUsd]) => ({
          sourceType,
          totalUsd: Math.round(amountUsd * 100) / 100,
        }))
        .sort((a, b) => b.totalUsd - a.totalUsd),
      totalUsd: Math.round(totalUsd * 100) / 100,
    };
  }

  async getAnalyticsContent(query: AdminDateRangeInput = {}) {
    const { start, end, label } = resolveAdminDateRange(query);
    const topDisliked = await this.topDislikedInPeriod(start, 20, end);
    return { range: label, topDisliked };
  }

  async exportAnalyticsCsv(query: AdminDateRangeInput = {}) {
    const { start, end, label } = resolveAdminDateRange(query);
    const [revenue, topContent, timeseries] = await Promise.all([
      this.getAnalyticsRevenue(query),
      this.topContentInPeriod(start, 20, end),
      this.getAnalyticsTimeseries(query),
    ]);

    const lines: string[] = [
      'section,metric,value',
      `overview,range,${label}`,
      `overview,premium_subscribers,${timeseries.premiumSubscribers}`,
    ];

    for (let i = 0; i < revenue.buckets.length; i++) {
      lines.push(
        `revenue,${revenue.buckets[i]},${revenue.revenueUsd[i]}`,
      );
    }
    for (const row of revenue.bySource) {
      lines.push(`revenue_source,${row.sourceType},${row.totalUsd}`);
    }
    for (const row of topContent) {
      lines.push(
        `top_content,${this.csvEscape(row.title)},${row.views}`,
      );
    }

    return lines.join('\n');
  }

  async listAuditLogs(query: AdminListQueryDto & { entityType?: string }) {
    const [total, items] = await this.auditLog.list(query);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 30));
    return {
      items: items.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        metadata: row.metadata,
        admin: {
          username: row.admin.username,
          displayName: row.admin.displayName,
        },
        createdAt: row.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    };
  }

  async getAnalyticsGeography(query: AdminDateRangeInput = {}) {
    const { start, end, label } = resolveAdminDateRange(query);

    const events = await this.prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { metadata: true, userId: true },
    });

    const userIds = [
      ...new Set(events.map((e) => e.userId).filter((id): id is string => !!id)),
    ];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, countryCode: true },
        })
      : [];
    const userCountry = new Map(
      users.map((u) => [u.id, u.countryCode?.toUpperCase() ?? null]),
    );

    const viewCounts = new Map<string, number>();
    const usersByCountry = new Map<string, Set<string>>();
    for (const event of events) {
      const meta = event.metadata as { countryCode?: string } | null;
      const fromMeta = meta?.countryCode?.toUpperCase().slice(0, 2);
      const fromUser = event.userId ? userCountry.get(event.userId) : null;
      const code = fromMeta || fromUser || 'ZZ';
      viewCounts.set(code, (viewCounts.get(code) ?? 0) + 1);
      if (event.userId) {
        if (!usersByCountry.has(code)) usersByCountry.set(code, new Set());
        usersByCountry.get(code)!.add(event.userId);
      }
    }

    const countries = [...viewCounts.entries()]
      .map(([countryCode, views]) => ({
        countryCode,
        views,
        users: usersByCountry.get(countryCode)?.size ?? 0,
      }))
      .sort((a, b) => b.views - a.views);

    return { range: label, countries };
  }

  listAdvertisers() {
    return this.advertisers.adminList();
  }

  updateAdvertiser(
    id: string,
    body: {
      companyName?: string;
      contactEmail?: string;
      billingEmail?: string | null;
      isVerified?: boolean;
    },
    adminId: string,
  ) {
    return this.advertisers.adminUpdate(id, body).then(async (row) => {
      await this.auditLog.log({
        adminId,
        action: 'update',
        entityType: 'advertiser_account',
        entityId: id,
      });
      return row;
    });
  }

  verifyAdvertiser(id: string, isVerified: boolean, adminId: string) {
    return this.advertisers.adminVerify(id, isVerified).then(async (row) => {
      await this.auditLog.log({
        adminId,
        action: isVerified ? 'verify' : 'unverify',
        entityType: 'advertiser_account',
        entityId: id,
      });
      return row;
    });
  }

  gafLedger(query: {
    page?: number;
    limit?: number;
    direction?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.gaf.ledger(query);
  }

  listGafPrograms() {
    return this.gaf.listPrograms();
  }

  createGafGrant(
    body: {
      amountUsd: number;
      programCategory: string;
      gafProgramId?: string;
      description?: string;
    },
    adminId: string,
  ) {
    return this.gaf.createGrant(body).then(async (row) => {
      await this.auditLog.log({
        adminId,
        action: 'create',
        entityType: 'gaf_ledger_entry',
        entityId: row.id,
        metadata: {
          direction: 'outflow',
          amountUsd: Number(row.amountUsd),
          programCategory: row.programCategory,
        },
      });
      return row;
    });
  }

  async deleteAdCampaign(id: string, adminId: string) {
    const existing = await this.prisma.adCampaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');
    await this.prisma.adCampaign.delete({ where: { id } });
    await this.auditLog.log({
      adminId,
      action: 'delete',
      entityType: 'ad_campaign',
      entityId: id,
      metadata: { title: existing.title },
    });
    return { success: true };
  }

  async deleteUser(id: string, adminId: string) {
    if (id === adminId) {
      throw new BadRequestException('Cannot delete your own account');
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.admin) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.admin },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin account');
      }
    }
    await this.prisma.user.delete({ where: { id } });
    await this.auditLog.log({
      adminId,
      action: 'delete',
      entityType: 'user',
      entityId: id,
      metadata: { username: user.username },
    });
    return { success: true };
  }

  async deleteAdvertiser(id: string, adminId: string) {
    const account = await this.prisma.advertiserAccount.findUnique({
      where: { id },
      select: { id: true, companyName: true },
    });
    if (!account) throw new NotFoundException('Advertiser not found');
    await this.prisma.$transaction([
      this.prisma.adCampaign.deleteMany({ where: { advertiserAccountId: id } }),
      this.prisma.advertiserAccount.delete({ where: { id } }),
    ]);
    await this.auditLog.log({
      adminId,
      action: 'delete',
      entityType: 'advertiser_account',
      entityId: id,
      metadata: { companyName: account.companyName },
    });
    return { success: true };
  }

  async deletePodcastShow(id: string, adminId: string) {
    const show = await this.prisma.podcastShow.findUnique({
      where: { id },
      include: { episodes: true },
    });
    if (!show) throw new NotFoundException('Podcast show not found');
    for (const episode of show.episodes) {
      await this.playlists.removeContentReferences('podcast_episode', episode.id);
      await this.storage.purgePodcastEpisodeAssets(episode);
    }
    await this.storage.purgePodcastShowAssets(show);
    await this.prisma.podcastShow.delete({ where: { id } });
    await this.auditLog.log({
      adminId,
      action: 'delete',
      entityType: 'podcast_show',
      entityId: id,
      metadata: { title: show.title },
    });
    return { success: true };
  }

  async deleteVerticalSeries(slug: string, adminId: string) {
    const series = await this.prisma.verticalSeries.findUnique({
      where: { slug },
      include: { episodes: true },
    });
    if (!series) throw new NotFoundException('Vertical series not found');
    for (const episode of series.episodes) {
      await this.storage.purgePublicMediaUrl(episode.videoUrl);
      await this.storage.purgePublicMediaUrl(episode.thumbnailUrl);
    }
    await this.prisma.verticalSeries.delete({ where: { id: series.id } });
    await this.auditLog.log({
      adminId,
      action: 'delete',
      entityType: 'vertical_series',
      entityId: series.id,
      metadata: { slug: series.slug, title: series.title },
    });
    return { success: true };
  }

  async deleteStream(id: string, adminId: string) {
    const stream = await this.prisma.stream.findUnique({
      where: { id },
      select: { id: true, title: true, status: true },
    });
    if (!stream) throw new NotFoundException('Stream not found');
    if (stream.status === StreamStatus.live) {
      throw new BadRequestException('End the live stream before deleting');
    }
    await this.prisma.stream.delete({ where: { id } });
    await this.auditLog.log({
      adminId,
      action: 'delete',
      entityType: 'stream',
      entityId: id,
      metadata: { title: stream.title },
    });
    return { success: true };
  }

  private async topDislikedInPeriod(start: Date, take = 20, end?: Date) {
    const viewedInPeriod = await this.prisma.analyticsEvent.groupBy({
      by: ['targetId'],
      where: {
        eventType: AnalyticsEventType.view,
        createdAt: { gte: start, ...(end ? { lte: end } : {}) },
        targetId: { not: null },
      },
      _count: { _all: true },
    });

    const viewsById = new Map(
      viewedInPeriod
        .filter((g) => g.targetId)
        .map((g) => [g.targetId!, g._count._all]),
    );
    const ids = [...viewsById.keys()];
    if (!ids.length) return [];

    const [videos, podcasts, verticals] = await Promise.all([
      this.prisma.video.findMany({
        where: {
          id: { in: ids },
          status: ContentStatus.ready,
          dislikesCount: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          type: true,
          dislikesCount: true,
          creator: { select: { username: true } },
        },
      }),
      this.prisma.podcastEpisode.findMany({
        where: {
          id: { in: ids },
          status: ContentStatus.ready,
          dislikesCount: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          dislikesCount: true,
          creator: { select: { username: true } },
        },
      }),
      this.prisma.verticalEpisode.findMany({
        where: {
          id: { in: ids },
          dislikesCount: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          dislikesCount: true,
          series: { select: { creator: { select: { username: true } } } },
        },
      }),
    ]);

    return [
      ...videos.map((v) => ({
        id: v.id,
        title: v.title,
        type: v.type,
        creator: `@${v.creator.username}`,
        dislikesCount: v.dislikesCount,
        views: viewsById.get(v.id) ?? 0,
      })),
      ...podcasts.map((e) => ({
        id: e.id,
        title: e.title,
        type: 'podcast_episode',
        creator: `@${e.creator.username}`,
        dislikesCount: e.dislikesCount,
        views: viewsById.get(e.id) ?? 0,
      })),
      ...verticals
        .filter((e) => e.series.creator)
        .map((e) => ({
          id: e.id,
          title: e.title,
          type: 'vertical_episode',
          creator: `@${e.series.creator!.username}`,
          dislikesCount: e.dislikesCount,
          views: viewsById.get(e.id) ?? 0,
        })),
    ]
      .sort(
        (a, b) =>
          b.dislikesCount - a.dislikesCount || b.views - a.views,
      )
      .slice(0, take);
  }

  private async topContentInPeriod(start: Date, take = 8, end?: Date) {
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['targetId'],
      where: {
        eventType: AnalyticsEventType.view,
        createdAt: { gte: start, ...(end ? { lte: end } : {}) },
        targetId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { targetId: 'desc' } },
      take,
    });

    const ids = grouped
      .map((g) => g.targetId)
      .filter((id): id is string => !!id);
    if (!ids.length) return [];

    const videos = await this.prisma.video.findMany({
      where: { id: { in: ids }, status: ContentStatus.ready },
      select: {
        id: true,
        title: true,
        type: true,
        creator: { select: { username: true } },
      },
    });
    const byId = new Map(videos.map((v) => [v.id, v]));

    return grouped
      .map((g) => {
        const video = g.targetId ? byId.get(g.targetId) : undefined;
        if (!video) return null;
        return {
          id: video.id,
          title: video.title,
          views: g._count._all,
          type: video.type,
          creator: `@${video.creator.username}`,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }

  private csvEscape(value: string) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private dayBuckets(days: number): string[] {
    const buckets: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push(d.toISOString().slice(0, 10));
    }
    return buckets;
  }

  private dateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private parsePeriodMonth(periodMonth?: string): Date {
    if (periodMonth?.match(/^\d{4}-\d{2}$/)) {
      return new Date(`${periodMonth}-01T00:00:00.000Z`);
    }
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  private async resolveTargetTitle(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string> {
    try {
      const t = await this.hydrateTarget(targetType, targetId);
      return t.title;
    } catch {
      return '(removed)';
    }
  }

  private async hydrateTarget(targetType: ReportTargetType, targetId: string) {
    switch (targetType) {
      case ReportTargetType.video: {
        const v = await this.prisma.video.findUnique({ where: { id: targetId } });
        if (!v) throw new NotFoundException('Target not found');
        return {
          title: v.title,
          excerpt: v.description,
          creatorId: v.creatorId,
          thumbnailUrl: v.thumbnailUrl,
        };
      }
      case ReportTargetType.comment: {
        const c = await this.prisma.comment.findUnique({
          where: { id: targetId },
          include: { video: { select: { title: true } } },
        });
        if (!c) throw new NotFoundException('Target not found');
        return {
          title: c.video.title,
          excerpt: c.body,
          creatorId: c.userId,
        };
      }
      case ReportTargetType.stream: {
        const s = await this.prisma.stream.findUnique({ where: { id: targetId } });
        if (!s) throw new NotFoundException('Target not found');
        return {
          title: s.title,
          excerpt: null,
          creatorId: s.creatorId,
          status: s.status,
        };
      }
      case ReportTargetType.user: {
        const u = await this.prisma.user.findUnique({ where: { id: targetId } });
        if (!u) throw new NotFoundException('Target not found');
        return {
          title: u.displayName ?? u.username,
          excerpt: u.bio,
          creatorId: u.id,
        };
      }
      case ReportTargetType.podcast_episode: {
        const e = await this.prisma.podcastEpisode.findUnique({
          where: { id: targetId },
        });
        if (!e) throw new NotFoundException('Target not found');
        return { title: e.title, excerpt: e.description, creatorId: e.creatorId };
      }
      case ReportTargetType.vertical_episode: {
        const e = await this.prisma.verticalEpisode.findUnique({
          where: { id: targetId },
          include: { series: { select: { title: true, creatorId: true } } },
        });
        if (!e) throw new NotFoundException('Target not found');
        return {
          title: `${e.series.title} — ${e.title}`,
          excerpt: e.description,
          creatorId: e.series.creatorId,
        };
      }
      default:
        return { title: 'Unknown', excerpt: null, creatorId: null };
    }
  }

  private async resolveTargetOwnerId(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string | null> {
    const t = await this.hydrateTarget(targetType, targetId);
    return t.creatorId;
  }

  private async deleteTargetContent(
    targetType: ReportTargetType,
    targetId: string,
  ) {
    switch (targetType) {
      case ReportTargetType.video:
        await this.deleteVideo(targetId);
        return;
      case ReportTargetType.comment:
        await this.deleteComment(targetId);
        return;
      case ReportTargetType.stream:
        await this.prisma.stream.update({
          where: { id: targetId },
          data: { status: StreamStatus.ended, endedAt: new Date() },
        });
        return;
      case ReportTargetType.podcast_episode:
        await this.deletePodcastEpisode(targetId);
        return;
      case ReportTargetType.vertical_episode:
        await this.prisma.verticalEpisode.delete({ where: { id: targetId } });
        return;
      case ReportTargetType.user:
        await this.setUserBanned(targetId, true);
        return;
      default:
        throw new BadRequestException('Cannot delete this target type');
    }
  }
}
