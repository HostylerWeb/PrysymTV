import { Injectable } from '@nestjs/common';
import { AdCampaignStatus, AdPlacement } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {}

  async serve(placement: AdPlacement): Promise<{ ad: ServedAd | null }> {
    const now = new Date();
    const campaigns = await this.prisma.adCampaign.findMany({
      where: {
        placement,
        status: AdCampaignStatus.active,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });

    const eligible = campaigns.filter(
      (c) => c.deliveredImpressions < c.targetImpressions,
    );
    if (!eligible.length) return { ad: null };

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

    const mediaType = /\.(mp4|webm)(\?|$)/i.test(picked.mediaUrl)
      ? 'video'
      : 'image';

    return {
      ad: {
        id: picked.id,
        title: picked.title,
        mediaUrl: picked.mediaUrl,
        clickThroughUrl: picked.clickThroughUrl,
        placement: picked.placement,
        mediaType,
        skipAfterSeconds:
          placement === AdPlacement.movie_preroll
            ? 15
            : placement === AdPlacement.shorts_interstitial
              ? 5
              : 0,
      },
    };
  }
}
