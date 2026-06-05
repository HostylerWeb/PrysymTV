import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  ContentStatus,
  CreatorBalanceEntryType,
  CreatorPartnerTier,
  PayoutStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  StreamStatus,
  StreamerStatus,
  VideoType,
} from '@prisma/client';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdCampaignDto } from './dto/create-ad-campaign.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminReportAction } from './dto/review-report.dto';
import { AdminPayoutAction } from './dto/process-payout.dto';
import { StreamerApplicationAction } from './dto/review-streamer-application.dto';
import { UpdateAdsConfigDto } from './dto/update-ads-config.dto';
import { UpdateAnalyticsConfigDto } from './dto/update-analytics-config.dto';
import { UpdateEconomyConfigDto } from './dto/update-economy-config.dto';
import { UpdateScorecardConfigDto } from './dto/update-scorecard-config.dto';
import { UpsertCoinPackageDto } from './dto/upsert-coin-package.dto';
import { UpsertGiftCatalogDto } from './dto/upsert-gift-catalog.dto';
import type {
  AdsSettings,
  AnalyticsSettings,
  ProgramConfigEntry,
  ScorecardSettings,
} from '../platform-settings/platform-settings.types';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
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

  async getOverview() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      dauRows,
      liveStreams,
      revenueAgg,
      pendingReports,
      pendingPayouts,
      pendingApps,
    ] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: since24h }, userId: { not: null } },
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
    ]);

    const pendingPayoutsUsd = pendingPayouts.reduce(
      (sum, p) => sum.plus(p.amountUsd),
      new Prisma.Decimal(0),
    );

    return {
      dau: dauRows.length,
      liveNow: liveStreams.length,
      liveViewers: liveStreams.reduce((s, x) => s + x.viewerCount, 0),
      revenueTodayUsd: Number(revenueAgg._sum.grossAmountUsd ?? 0),
      pendingReports,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutsUsd: Number(pendingPayoutsUsd),
      pendingStreamerApplications: pendingApps,
    };
  }

  async listReports(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.ReportWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as ReportStatus;
    }

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
        _count: {
          select: {
            videos: true,
            reportsFiled: true,
            reportsReviewed: true,
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

    const content = await this.prisma.video.findMany({
      where: { creatorId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        viewsCount: true,
      },
    });

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
      partnerTier: user.partnerTier,
      coins: user.coinsBalance,
      bio: user.bio,
      joinedAt: user.createdAt.toISOString().slice(0, 10),
      counts: {
        videos: user._count.videos,
        reportsFiled: user._count.reportsFiled,
      },
      content: content.map((v) => ({
        type: v.type,
        title: v.title,
        id: v.id,
        views: v.viewsCount,
        status: v.status,
      })),
      financial: {
        balanceUsd: Number(balanceUsd),
        lifetimeEarningsUsd: Number(balance._sum.amountUsd ?? 0),
        coins: user.coinsBalance,
        payouts: payouts.map((p) => ({
          id: p.id,
          amountUsd: Number(p.amountUsd),
          status: p.status,
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

  async listPayouts(query: AdminListQueryDto) {
    const { page, limit, skip, take } = this.paginate(query.page, query.limit);
    const where: Prisma.CreatorPayoutWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as PayoutStatus;
    }

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

    const [items, total] = await Promise.all([
      this.prisma.revenueLedgerBatch.findMany({
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
      this.prisma.revenueLedgerBatch.count(),
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

  async deleteVideo(id: string) {
    try {
      await this.prisma.video.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Video not found');
    }
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
          v.type === VideoType.short
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
        siteHref: `/verticals/${series.slug}/${ep.id}`,
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
        siteHref: `/podcasts/${showId}/${ep.id}`,
      })),
      meta: { page, limit, total },
    };
  }

  async deleteVerticalEpisode(id: string) {
    try {
      await this.prisma.verticalEpisode.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Episode not found');
    }
  }

  async deletePodcastEpisode(id: string) {
    try {
      await this.prisma.podcastEpisode.delete({ where: { id } });
      return { success: true };
    } catch {
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
        isActive: g.isActive,
      })),
    };
  }

  updateEconomyConfig(adminId: string, body: UpdateEconomyConfigDto) {
    return this.platformSettings.setEconomy(body, adminId);
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
    return this.platformSettings.setPrograms(programs, adminId);
  }

  async upsertCoinPackage(body: UpsertCoinPackageDto) {
    const row = await this.prisma.coinPackage.upsert({
      where: { id: body.id },
      create: {
        id: body.id,
        coins: body.coins,
        priceUsd: body.priceUsd,
        label: body.label,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
      update: {
        coins: body.coins,
        priceUsd: body.priceUsd,
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
    const row = await this.prisma.giftCatalog.upsert({
      where: { id: body.id },
      create: {
        id: body.id,
        name: body.name,
        coinCost: body.coinCost,
        animationKey: body.animationKey,
        isActive: body.isActive ?? true,
      },
      update: {
        name: body.name,
        coinCost: body.coinCost,
        animationKey: body.animationKey,
        isActive: body.isActive ?? true,
      },
    });
    return {
      id: row.id,
      name: row.name,
      coinCost: row.coinCost,
      animationKey: row.animationKey,
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

  listAdCampaigns() {
    return this.prisma.adCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdCampaign(id: string) {
    const campaign = await this.prisma.adCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  createAdCampaign(dto: CreateAdCampaignDto) {
    return this.prisma.adCampaign.create({
      data: {
        advertiserName: dto.advertiserName,
        title: dto.title,
        mediaUrl: dto.mediaUrl,
        clickThroughUrl: dto.clickThroughUrl,
        placement: dto.placement,
        targetImpressions: dto.targetImpressions,
        budgetUsd: dto.budgetUsd,
        status: dto.status ?? 'active',
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async updateAdCampaignStatus(id: string, status: import('@prisma/client').AdCampaignStatus) {
    try {
      return await this.prisma.adCampaign.update({
        where: { id },
        data: { status },
      });
    } catch {
      throw new NotFoundException('Campaign not found');
    }
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
        await this.prisma.podcastEpisode.delete({ where: { id: targetId } });
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
