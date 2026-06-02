import { Injectable, ForbiddenException } from '@nestjs/common';
import {
  AnalyticsEventType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TrackEventsDto } from './dto/track-events.dto';
import { TrackContentAdDto } from './dto/track-content-ad.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackBatch(userId: string | undefined, dto: TrackEventsDto) {
    if (!dto.events.length) return { success: true, recorded: 0 };

    await this.prisma.analyticsEvent.createMany({
      data: dto.events.map((e) => ({
        eventType: e.eventType,
        userId: userId ?? null,
        targetId: e.targetId ?? null,
        metadata: (e.metadata ?? {}) as Prisma.InputJsonValue,
      })),
    });

    return { success: true, recorded: dto.events.length };
  }

  async trackContentAd(
    dto: TrackContentAdDto,
    eventType: 'ad_impression' | 'ad_click',
  ) {
    await this.prisma.$transaction([
      this.prisma.contentAdEvent.create({
        data: {
          campaignId: dto.campaignId,
          creatorId: dto.creatorId,
          videoId: dto.videoId,
          placement: dto.placement,
          eventType,
          viewerUserId: dto.viewerUserId,
        },
      }),
      this.prisma.analyticsEvent.create({
        data: {
          eventType,
          userId: dto.viewerUserId ?? null,
          targetId: dto.campaignId,
          metadata: {
            creatorId: dto.creatorId,
            videoId: dto.videoId,
            placement: dto.placement,
          },
        },
      }),
      this.prisma.adCampaign.update({
        where: { id: dto.campaignId },
        data:
          eventType === AnalyticsEventType.ad_impression
            ? { deliveredImpressions: { increment: 1 } }
            : { clicks: { increment: 1 } },
      }),
    ]);

    return { success: true };
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
        _count: { select: { followers: true, videos: true } },
      },
    });

    const videos = await this.prisma.video.findMany({
      where: { creatorId, status: 'ready' },
      select: {
        id: true,
        title: true,
        type: true,
        vertical: true,
        viewsCount: true,
        likesCount: true,
        commentsCount: true,
        thumbnailUrl: true,
        createdAt: true,
      },
      orderBy: { viewsCount: 'desc' },
      take: 50,
    });

    const videoIds = videos.map((v) => v.id);

    const [
      adImpressions24h,
      adImpressions7d,
      adImpressions30d,
      adClicks30d,
      watchEvents30d,
      balanceSum,
      gifts30d,
      latestImpact,
      perVideoAds,
    ] = await Promise.all([
      this.prisma.contentAdEvent.count({
        where: {
          creatorId,
          eventType: 'ad_impression',
          createdAt: { gte: since24h },
        },
      }),
      this.prisma.contentAdEvent.count({
        where: {
          creatorId,
          eventType: 'ad_impression',
          createdAt: { gte: since7d },
        },
      }),
      this.prisma.contentAdEvent.count({
        where: {
          creatorId,
          eventType: 'ad_impression',
          createdAt: { gte: since30d },
        },
      }),
      this.prisma.contentAdEvent.count({
        where: {
          creatorId,
          eventType: 'ad_click',
          createdAt: { gte: since30d },
        },
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
      this.prisma.viewerSupportTransaction.count({
        where: { receiverId: creatorId, createdAt: { gte: since30d } },
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
      perVideoAds
        .filter((r) => r.videoId)
        .map((r) => [r.videoId!, r._count._all]),
    );

    const pendingPayout = await this.prisma.creatorBalanceLedger.aggregate({
      where: { creatorId, entryType: 'credit' },
      _sum: { amountUsd: true },
    });

    const earnings30d = await this.sumLedgerCredits(creatorId, since30d);

    return {
      partnerTier: user?.partnerTier ?? 'standard',
      programVerticals: user?.programVerticals.map((p) => p.vertical) ?? [],
      performance: {
        views24h,
        views7d,
        views30d,
        watchHours30d: Math.round(watchHours30d * 10) / 10,
        subscribers: user?._count.followers ?? 0,
        engagement30d: gifts30d,
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
        pendingPayoutUsd: pendingPayout._sum.amountUsd?.toString() ?? '0',
        lifetimeCreditsUsd: balanceSum._sum.amountUsd?.toString() ?? '0',
      },
      communityImpact: {
        jobsSupported: latestImpact?.jobsSupported ?? 0,
        businessesFunded: latestImpact?.businessesFunded ?? 0,
        dollarsInvested: latestImpact?.dollarsInvested?.toString() ?? '0',
        workforceOpportunities: latestImpact?.workforceOpportunities ?? 0,
      },
      topContent: videos.slice(0, 5).map((v) => ({
        id: v.id,
        title: v.title,
        type: v.type,
        vertical: v.vertical,
        viewsCount: v.viewsCount,
        likesCount: v.likesCount,
        adImpressions30d: adByVideo.get(v.id) ?? 0,
        thumbnailUrl: v.thumbnailUrl,
      })),
      content: videos.map((v) => ({
        id: v.id,
        title: v.title,
        type: v.type,
        vertical: v.vertical,
        viewsCount: v.viewsCount,
        likesCount: v.likesCount,
        commentsCount: v.commentsCount,
        adImpressions30d: adByVideo.get(v.id) ?? 0,
        thumbnailUrl: v.thumbnailUrl,
        createdAt: v.createdAt,
      })),
    };
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
