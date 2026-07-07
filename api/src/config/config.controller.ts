import { Controller, Get, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AnalyticsService } from '../analytics/analytics.service';
import { CREATOR_SUB_PLANS } from '../billing/creator-sub-plans';
import { resolveRequestGeo } from '../common/geo/request-geo';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { PushService } from '../notifications/push.service';
import { buildPublicOAuthConfig } from './oauth-public.config';

/** Public, cache-friendly config for consumer apps (no secrets). */
@Controller('config')
export class ConfigController {
  constructor(
    private readonly platformSettings: PlatformSettingsService,
    private readonly analytics: AnalyticsService,
    private readonly config: ConfigService,
    private readonly push: PushService,
  ) {}

  @Get('viewer-geo')
  viewerGeo(@Req() req: Request) {
    const geo = resolveRequestGeo(req);
    if (geo.label === 'Unknown location') {
      return { geo: null };
    }
    return {
      geo: {
        city: geo.city,
        region: geo.region,
        regionName: geo.regionName,
        countryCode: geo.countryCode,
      },
    };
  }

  @Get('public')
  async publicConfig() {
    const [ads, economy, platformCreatorId] = await Promise.all([
      this.platformSettings.getAds(),
      this.platformSettings.getEconomy(),
      this.analytics.resolvePlatformCreatorId().catch(() => null),
    ]);
    return {
      platformCreatorId,
      membership: {
        priceUsd: economy.membershipPriceUsd,
        label: 'Prysym Membership',
        perks: [
          'Ad-free on Shorts, Verticals, and Movies',
          'Skip movie preroll ads',
        ],
      },
      insider: {
        priceUsd: economy.insiderPriceUsd,
        label: 'Platform Insider',
        perks: [
          'Product roadmaps and early previews',
          'Insider town halls with the Prysym team',
          'Vote on platform priorities',
          'Exclusive insider community access',
        ],
      },
      channelMembership: {
        basic: {
          priceUsd: CREATOR_SUB_PLANS.basic.priceUsd,
          label: CREATOR_SUB_PLANS.basic.label,
        },
        premium: {
          priceUsd: CREATOR_SUB_PLANS.premium.priceUsd,
          label: CREATOR_SUB_PLANS.premium.label,
        },
      },
      ads: {
        shortsInterstitialEveryNSwipes: ads.shortsInterstitialEveryNSwipes,
        shortsInterstitialEnabled: ads.placements.shorts_interstitial,
        shortsSkipSeconds: ads.shortsSkipSeconds,
        moviePrerollSkipSeconds: ads.moviePrerollSkipSeconds,
        impressionRevenueCpmUsd: ads.impressionRevenueCpmUsd,
        placements: ads.placements,
      },
      auth: buildPublicOAuthConfig(this.config),
      push: {
        enabled: this.push.isEnabled(),
        publicKey: this.push.getPublicKey(),
      },
    };
  }
}
