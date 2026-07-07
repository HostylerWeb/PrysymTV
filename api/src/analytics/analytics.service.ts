import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import {
  geoFromClientHint,
  resolveRequestGeo,
  type RequestGeo,
} from '../common/geo/request-geo';
import { ViewerGeoDto } from './dto/viewer-geo.dto';
import {
  AnalyticsEventType,
  Prisma,
  RevenueSourceType,
  UserRole,
} from '@prisma/client';
import { CreatorsBalanceService } from '../billing/creators-balance.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { TrackEventsDto } from './dto/track-events.dto';
import { TrackContentAdDto } from './dto/track-content-ad.dto';

const COIN_USD = new Prisma.Decimal('0.01');

@Injectable()
export class AnalyticsService {
  private platformCreatorIdCache: string | null | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly creatorsBalance: CreatorsBalanceService,
    private readonly platformSettings: PlatformSettingsService,
    private readonly revenueSplit: RevenueSplitService,
  ) {}

  async trackBatch(
    userId: string | undefined,
    dto: TrackEventsDto,
    countryCode?: string,
  ) {
    if (!dto.events.length) return { success: true, recorded: 0 };

    if (userId && countryCode) {
      await this.prisma.user.updateMany({
        where: { id: userId, countryCode: null },
        data: { countryCode: countryCode.toUpperCase().slice(0, 2) },
      });
    }

    await this.prisma.analyticsEvent.createMany({
      data: dto.events.map((e) => ({
        eventType: e.eventType,
        userId: userId ?? null,
        targetId: e.targetId ?? null,
        metadata: {
          ...(e.metadata ?? {}),
          ...(countryCode ? { countryCode: countryCode.toUpperCase().slice(0, 2) } : {}),
        } as Prisma.InputJsonValue,
      })),
    });

    for (const e of dto.events) {
      if (e.eventType === 'share' && e.targetId) {
        await this.prisma.video
          .update({
            where: { id: e.targetId },
            data: { sharesCount: { increment: 1 } },
          })
          .catch(() => {});
      }
    }

    return { success: true, recorded: dto.events.length };
  }

  async recordViewEvent(params: {
    videoId: string;
    creatorId: string;
    userId?: string;
    countryCode?: string;
  }) {
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: 'view',
        userId: params.userId ?? null,
        targetId: params.videoId,
        metadata: {
          creatorId: params.creatorId,
          ...(params.countryCode
            ? { countryCode: params.countryCode.toUpperCase().slice(0, 2) }
            : {}),
        },
      },
    });
  }

  async resolvePlatformCreatorId(): Promise<string> {
    if (this.platformCreatorIdCache !== undefined) {
      if (!this.platformCreatorIdCache) {
        throw new NotFoundException('Platform creator not configured');
      }
      return this.platformCreatorIdCache;
    }
    const admin = await this.prisma.user.findFirst({
      where: { role: UserRole.admin },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    this.platformCreatorIdCache = admin?.id ?? null;
    if (!admin) throw new NotFoundException('Platform creator not configured');
    return admin.id;
  }

  private async resolveAdEventGeo(
    req: Request,
    headerCountry?: string,
    viewerUserId?: string,
    viewerGeo?: ViewerGeoDto,
  ): Promise<RequestGeo> {
    let geo = resolveRequestGeo(req, headerCountry);
    if (geo.label === 'Unknown location' && viewerGeo) {
      const fromClient = geoFromClientHint(viewerGeo);
      if (fromClient) return fromClient;
    }
    if (geo.label !== 'Unknown location' || !viewerUserId) return geo;

    const user = await this.prisma.user.findUnique({
      where: { id: viewerUserId },
      select: { countryCode: true },
    });
    if (!user?.countryCode) return geo;

    geo = {
      city: null,
      region: null,
      regionName: null,
      countryCode: user.countryCode.toUpperCase().slice(0, 2),
      label: user.countryCode.toUpperCase().slice(0, 2),
    };
    return geo;
  }

  async trackContentAd(
    dto: TrackContentAdDto,
    eventType: 'ad_impression' | 'ad_click',
    req?: Request,
    headerCountry?: string,
  ) {
    const adsConfig = await this.platformSettings.getAds();
    const creatorId = dto.creatorId ?? (await this.resolvePlatformCreatorId());

    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: dto.campaignId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const ruleKey = campaign.revenueRuleKey || adsConfig.gafRuleKey;
    const location =
      req != null
        ? await this.resolveAdEventGeo(
            req,
            headerCountry,
            dto.viewerUserId,
            dto.viewerGeo,
          )
        : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.contentAdEvent.create({
        data: {
          campaignId: dto.campaignId,
          creatorId,
          videoId: dto.videoId,
          placement: dto.placement,
          eventType,
          viewerUserId: dto.viewerUserId,
          metadata: location ? { location } : undefined,
        },
      });
      await tx.analyticsEvent.create({
        data: {
          eventType,
          userId: dto.viewerUserId ?? null,
          targetId: dto.campaignId,
          metadata: {
            creatorId,
            videoId: dto.videoId,
            placement: dto.placement,
            ...(location ? { location } : {}),
          },
        },
      });
      if (eventType === 'ad_click') {
        await tx.adCampaign.update({
          where: { id: dto.campaignId },
          data: { clicks: { increment: 1 } },
        });
      }
    });

    if (eventType === 'ad_impression' && adsConfig.impressionRevenueCpmUsd > 0) {
      const gross = new Prisma.Decimal(adsConfig.impressionRevenueCpmUsd).div(1000);
      const platformId = await this.resolvePlatformCreatorId();
      await this.revenueSplit.distributeAndPersist({
        ruleKey,
        sourceType: RevenueSourceType.ad_impression,
        sourceId: dto.campaignId,
        grossAmountUsd: gross,
        creatorId: creatorId !== platformId ? creatorId : undefined,
        metadata: {
          placement: dto.placement,
          videoId: dto.videoId,
          campaignId: dto.campaignId,
        },
      });
    }

    return { success: true };
  }

  private async completeCampaignIfNeeded(campaignId: string, cpmUsd: number) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.status !== 'active') return;

    const spent = new Prisma.Decimal(cpmUsd)
      .div(1000)
      .mul(campaign.deliveredImpressions);
    const hitTarget = campaign.deliveredImpressions >= campaign.targetImpressions;
    const overBudget = spent.gte(campaign.budgetUsd);

    if (hitTarget || overBudget) {
      await this.prisma.adCampaign.update({
        where: { id: campaignId },
        data: { status: 'completed' },
      });
    }
  }

  private periodStart(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  async getCreatorDashboard(creatorId: string) {
    const since24h = this.periodStart(1);
    const since7d = this.periodStart(7);
    const since30d = this.periodStart(30);

    const user = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        partnerTier: true,
        programVerticals: { select: { vertical: true } },
        _count: { select: { followers: true } },
      },
    });

    const [videos, podcastEpisodes, verticalEpisodes] = await Promise.all([
      this.prisma.video.findMany({
        where: { creatorId, status: 'ready' },
        select: {
          id: true,
          title: true,
          type: true,
          vertical: true,
          viewsCount: true,
          likesCount: true,
          dislikesCount: true,
          commentsCount: true,
          sharesCount: true,
          thumbnailUrl: true,
          createdAt: true,
        },
        orderBy: { viewsCount: 'desc' },
        take: 50,
      }),
      this.prisma.podcastEpisode.findMany({
        where: { creatorId, status: 'ready' },
        select: {
          id: true,
          title: true,
          playsCount: true,
          likesCount: true,
          dislikesCount: true,
          coverUrl: true,
          createdAt: true,
        },
        orderBy: { playsCount: 'desc' },
        take: 30,
      }),
      this.prisma.verticalEpisode.findMany({
        where: { series: { creatorId } },
        select: {
          id: true,
          title: true,
          viewsCount: true,
          likesCount: true,
          dislikesCount: true,
          thumbnailUrl: true,
          createdAt: true,
          series: { select: { title: true } },
        },
        orderBy: { viewsCount: 'desc' },
        take: 30,
      }),
    ]);

    const videoIds = videos.map((v) => v.id);

    const [
      adImpressions24h,
      adImpressions7d,
      adImpressions30d,
      adClicks30d,
      watchEvents30d,
      balanceSum,
      giftStats30d,
      giftStatsLifetime,
      giftEarnings30d,
      giftEarningsLifetime,
      recentGifts,
      viewerSupportRule,
      likes30d,
      comments30d,
      latestImpact,
      perVideoAds,
      gafInflow,
    ] = await Promise.all([
      this.prisma.contentAdEvent.count({
        where: { creatorId, eventType: 'ad_impression', createdAt: { gte: since24h } },
      }),
      this.prisma.contentAdEvent.count({
        where: { creatorId, eventType: 'ad_impression', createdAt: { gte: since7d } },
      }),
      this.prisma.contentAdEvent.count({
        where: { creatorId, eventType: 'ad_impression', createdAt: { gte: since30d } },
      }),
      this.prisma.contentAdEvent.count({
        where: { creatorId, eventType: 'ad_click', createdAt: { gte: since30d } },
      }),
      this.prisma.analyticsEvent.findMany({
        where: {
          eventType: 'watch_time',
          createdAt: { gte: since30d },
          metadata: { path: ['creatorId'], equals: creatorId },
        },
        select: { metadata: true },
      }),
      this.prisma.creatorBalanceLedger.aggregate({
        where: { creatorId, entryType: 'credit' },
        _sum: { amountUsd: true },
      }),
      this.prisma.gift.aggregate({
        where: { receiverId: creatorId, createdAt: { gte: since30d } },
        _sum: { coinValue: true },
        _count: true,
      }),
      this.prisma.gift.aggregate({
        where: { receiverId: creatorId },
        _sum: { coinValue: true },
        _count: true,
      }),
      this.sumGiftLedgerCredits(creatorId, since30d),
      this.sumGiftLedgerCredits(creatorId),
      this.prisma.gift.findMany({
        where: { receiverId: creatorId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          sender: { select: { username: true, displayName: true } },
          catalog: { select: { name: true } },
          revenueBatch: {
            include: {
              entries: {
                where: { party: 'creator' },
                select: { amountUsd: true },
              },
            },
          },
        },
      }),
      this.revenueSplit.getRule('viewer_support'),
      this.prisma.like.count({
        where: {
          createdAt: { gte: since30d },
          OR: [
            { targetType: 'video', targetId: { in: videoIds } },
            { targetType: 'podcast_episode', targetId: { in: podcastEpisodes.map((e) => e.id) } },
            { targetType: 'vertical_episode', targetId: { in: verticalEpisodes.map((e) => e.id) } },
          ],
        },
      }),
      this.prisma.comment.count({
        where: { userId: creatorId, createdAt: { gte: since30d } },
      }),
      this.prisma.creatorImpactSnapshot.findFirst({
        where: { creatorId },
        orderBy: { periodMonth: 'desc' },
      }),
      videoIds.length
        ? this.prisma.contentAdEvent.groupBy({
            by: ['videoId'],
            where: {
              creatorId,
              videoId: { in: videoIds },
              eventType: 'ad_impression',
              createdAt: { gte: since30d },
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      this.prisma.gafLedgerEntry.aggregate({
        where: {
          direction: 'inflow',
          createdAt: { gte: since30d },
          revenueBatch: { creatorId },
        },
        _sum: { amountUsd: true },
      }),
    ]);

    const countViews = async (since: Date) => {
      if (!videoIds.length) return 0;
      return this.prisma.analyticsEvent.count({
        where: {
          eventType: 'view',
          targetId: { in: videoIds },
          createdAt: { gte: since },
        },
      });
    };

    const [views24h, views7d, views30d] = await Promise.all([
      countViews(since24h),
      countViews(since7d),
      countViews(since30d),
    ]);

    const watchHours30d = watchEvents30d.reduce((sum, row) => {
      const meta = row.metadata as { seconds?: number } | null;
      const sec = typeof meta?.seconds === 'number' ? meta.seconds : 0;
      return sum + sec / 3600;
    }, 0);

    const adByVideo = new Map(
      perVideoAds.filter((r) => r.videoId).map((r) => [r.videoId!, r._count._all]),
    );

    const availableBalance =
      await this.creatorsBalance.computeAvailableBalance(creatorId);
    const earnings30d = await this.sumLedgerCredits(creatorId, since30d);

    const allContent = [
      ...videos.map((v) => ({
        id: v.id,
        title: v.title,
        type: v.type,
        vertical: v.vertical,
        viewsCount: v.viewsCount,
        likesCount: v.likesCount,
        dislikesCount: v.dislikesCount,
        commentsCount: v.commentsCount,
        adImpressions30d: adByVideo.get(v.id) ?? 0,
        thumbnailUrl: v.thumbnailUrl,
        createdAt: v.createdAt,
      })),
      ...podcastEpisodes.map((e) => ({
        id: e.id,
        title: e.title,
        type: 'podcast_episode',
        vertical: 'podcast' as const,
        viewsCount: e.playsCount,
        likesCount: e.likesCount,
        dislikesCount: e.dislikesCount,
        commentsCount: 0,
        adImpressions30d: 0,
        thumbnailUrl: e.coverUrl,
        createdAt: e.createdAt,
      })),
      ...verticalEpisodes.map((e) => ({
        id: e.id,
        title: `${e.series.title} — ${e.title}`,
        type: 'vertical_episode',
        vertical: null,
        viewsCount: e.viewsCount,
        likesCount: e.likesCount,
        dislikesCount: e.dislikesCount,
        commentsCount: 0,
        adImpressions30d: 0,
        thumbnailUrl: e.thumbnailUrl,
        createdAt: e.createdAt,
      })),
    ].sort((a, b) => b.viewsCount - a.viewsCount);

    const computedImpactUsd = Number(gafInflow._sum.amountUsd ?? 0);
    const coinsReceived30d = giftStats30d._sum.coinValue ?? 0;
    const coinsReceivedLifetime = giftStatsLifetime._sum.coinValue ?? 0;
    const creatorSharePercent = viewerSupportRule.creatorBps / 100;
    const grossGifts30dUsd = COIN_USD.mul(coinsReceived30d);
    const grossGiftsLifetimeUsd = COIN_USD.mul(coinsReceivedLifetime);

    return {
      partnerTier: user?.partnerTier ?? 'standard',
      programVerticals: user?.programVerticals.map((p) => p.vertical) ?? [],
      performance: {
        views24h,
        views7d,
        views30d,
        watchHours30d: Math.round(watchHours30d * 10) / 10,
        subscribers: user?._count.followers ?? 0,
        engagement30d: likes30d + comments30d + giftStats30d._count,
        retentionRate: latestImpact?.retentionRate ?? null,
      },
      advertising: {
        adImpressionsOnYourContent24h: adImpressions24h,
        adImpressionsOnYourContent7d: adImpressions7d,
        adImpressionsOnYourContent30d: adImpressions30d,
        adClicksOnYourContent30d: adClicks30d,
        ctr30d:
          adImpressions30d > 0
            ? Math.round((adClicks30d / adImpressions30d) * 10000) / 100
            : 0,
      },
      financial: {
        earnings30dUsd: earnings30d.toString(),
        adRevenueUsd: latestImpact?.adRevenueUsd?.toString() ?? '0',
        sponsorshipRevenueUsd:
          latestImpact?.sponsorshipRevenueUsd?.toString() ?? '0',
        merchandiseRevenueUsd:
          latestImpact?.merchandiseRevenueUsd?.toString() ?? '0',
        donationsUsd: latestImpact?.donationsUsd?.toString() ?? '0',
        giftsEarnings30dUsd: giftEarnings30d.toFixed(2),
        giftsEarningsLifetimeUsd: giftEarningsLifetime.toFixed(2),
        pendingPayoutUsd: availableBalance.toFixed(2),
        availableBalanceUsd: availableBalance.toFixed(2),
        lifetimeCreditsUsd: balanceSum._sum.amountUsd?.toString() ?? '0',
      },
      communityImpact: {
        jobsSupported: latestImpact?.jobsSupported ?? 0,
        businessesFunded: latestImpact?.businessesFunded ?? 0,
        dollarsInvested: (
          Number(latestImpact?.dollarsInvested ?? 0) + computedImpactUsd
        ).toFixed(2),
        workforceOpportunities: latestImpact?.workforceOpportunities ?? 0,
      },
      gifts: {
        creatorSharePercent,
        coinsReceived30d,
        coinsReceivedLifetime,
        giftCount30d: giftStats30d._count,
        giftCountLifetime: giftStatsLifetime._count,
        grossValue30dUsd: grossGifts30dUsd.toFixed(2),
        grossValueLifetimeUsd: grossGiftsLifetimeUsd.toFixed(2),
        earnings30dUsd: giftEarnings30d.toFixed(2),
        earningsLifetimeUsd: giftEarningsLifetime.toFixed(2),
        recent: recentGifts.map((g) => {
          const creatorUsd =
            g.revenueBatch?.entries[0]?.amountUsd ??
            COIN_USD.mul(g.coinValue).mul(viewerSupportRule.creatorBps).div(10000);
          return {
            id: g.id,
            giftName: g.catalog.name,
            fromUsername: g.sender.username,
            fromDisplayName: g.sender.displayName,
            coins: g.coinValue,
            grossUsd: COIN_USD.mul(g.coinValue).toFixed(2),
            creatorEarningsUsd: creatorUsd.toFixed(2),
            createdAt: g.createdAt.toISOString(),
          };
        }),
      },
      topContent: allContent.slice(0, 5),
      content: allContent,
    };
  }

  private async sumGiftLedgerCredits(creatorId: string, since?: Date) {
    const rows = await this.prisma.revenueLedgerEntry.findMany({
      where: {
        party: 'creator',
        ...(since ? { createdAt: { gte: since } } : {}),
        batch: {
          creatorId,
          sourceType: RevenueSourceType.gift,
        },
      },
      select: { amountUsd: true },
    });
    return rows.reduce((s, r) => s.plus(r.amountUsd), new Prisma.Decimal(0));
  }

  private async sumLedgerCredits(creatorId: string, since: Date) {
    const rows = await this.prisma.revenueLedgerEntry.findMany({
      where: {
        party: 'creator',
        createdAt: { gte: since },
        batch: { creatorId },
      },
      select: { amountUsd: true },
    });
    return rows.reduce((s, r) => s.plus(r.amountUsd), new Prisma.Decimal(0));
  }

  assertCreatorAccess(userId: string, role: string, targetCreatorId: string) {
    if (role === UserRole.admin) return;
    if (userId !== targetCreatorId) {
      throw new ForbiddenException('Not allowed to view this creator analytics');
    }
  }
}
