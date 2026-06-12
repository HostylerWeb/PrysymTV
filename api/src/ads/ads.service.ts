import { Injectable } from '@nestjs/common';
import { AdCampaign, AdCampaignStatus, AdPlacement, Prisma } from '@prisma/client';
import { isPremiumActive } from '../common/utils/premium.util';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PrismaService } from '../prisma/prisma.service';

export type ServedAd = {
  id: string;
  title: string;
  mediaUrl: string;
  clickThroughUrl: string;
  placement: AdPlacement;
  mediaType: 'image' | 'video';
  skipAfterSeconds: number;
};

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  async serve(
    placement: AdPlacement,
    viewerUserId?: string,
    options?: { peek?: boolean },
  ): Promise<{ ad: ServedAd | null; adFree?: boolean }> {
    const adsConfig = await this.platformSettings.getAds();
    if (!adsConfig.placements[placement]) {
      return { ad: null };
    }

    if (viewerUserId) {
      const viewer = await this.prisma.user.findUnique({
        where: { id: viewerUserId },
        select: { premiumTier: true, premiumExpiresAt: true },
      });
      if (
        viewer &&
        isPremiumActive(viewer.premiumTier, viewer.premiumExpiresAt)
      ) {
        return { ad: null, adFree: true };
      }
    }

    const picked = await this.pickEligibleCampaign(placement);
    if (!picked) return { ad: null };

    if (!options?.peek) {
      await this.recordImpression(picked.id, adsConfig.impressionRevenueCpmUsd);
    }

    return {
      ad: this.toServedAd(picked, placement, adsConfig),
    };
  }

  private async pickEligibleCampaign(
    placement: AdPlacement,
  ): Promise<AdCampaign | null> {
    const now = new Date();
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        placement,
        status: AdCampaignStatus.active,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });

    const adsConfig = await this.platformSettings.getAds();
    const cpm = adsConfig.impressionRevenueCpmUsd;
    const eligible = campaigns.filter((c) => {
      if (!c.mediaUrl?.trim()) return false;
      if (c.deliveredImpressions >= c.targetImpressions) return false;
      const spent = new Prisma.Decimal(cpm)
        .div(1000)
        .mul(c.deliveredImpressions);
      return spent.lt(c.budgetUsd);
    });
    if (!eligible.length) return null;

    const weights = eligible.map(
      (c) => c.targetImpressions - c.deliveredImpressions,
    );
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let picked = eligible[0];
    for (let i = 0; i < eligible.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        picked = eligible[i];
        break;
      }
    }

    return picked;
  }

  private async recordImpression(campaignId: string, cpm: number) {
    await this.prisma.adCampaign.update({
      where: { id: campaignId },
      data: { deliveredImpressions: { increment: 1 } },
    });

    const updated = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!updated) return;

    const spent = new Prisma.Decimal(cpm)
      .div(1000)
      .mul(updated.deliveredImpressions);
    if (
      updated.deliveredImpressions >= updated.targetImpressions ||
      spent.gte(updated.budgetUsd)
    ) {
      await this.prisma.adCampaign.update({
        where: { id: campaignId },
        data: { status: AdCampaignStatus.completed },
      });
    }
  }

  private toServedAd(
    picked: AdCampaign,
    placement: AdPlacement,
    adsConfig: Awaited<ReturnType<PlatformSettingsService['getAds']>>,
  ): ServedAd {
    const mediaType = /\.(mp4|webm)(\?|$)/i.test(picked.mediaUrl)
      ? 'video'
      : 'image';

    return {
      id: picked.id,
      title: picked.title,
      mediaUrl: picked.mediaUrl,
      clickThroughUrl: picked.clickThroughUrl,
      placement: picked.placement,
      mediaType,
      skipAfterSeconds:
        placement === AdPlacement.movie_preroll
          ? adsConfig.moviePrerollSkipSeconds
          : placement === AdPlacement.shorts_interstitial
            ? adsConfig.shortsSkipSeconds
            : placement === AdPlacement.vertical_episode
              ? adsConfig.shortsSkipSeconds
              : 0,
    };
  }
}
