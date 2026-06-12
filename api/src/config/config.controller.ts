import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsService } from '../analytics/analytics.service';
import { resolveRequestGeo } from '../common/geo/request-geo';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

/** Public, cache-friendly config for consumer apps (no secrets). */
@Controller('config')
export class ConfigController {
  constructor(
    private readonly platformSettings: PlatformSettingsService,
    private readonly analytics: AnalyticsService,
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
      ads: {
        shortsInterstitialEveryNSwipes: ads.shortsInterstitialEveryNSwipes,
        shortsInterstitialEnabled: ads.placements.shorts_interstitial,
        shortsSkipSeconds: ads.shortsSkipSeconds,
        moviePrerollSkipSeconds: ads.moviePrerollSkipSeconds,
        impressionRevenueCpmUsd: ads.impressionRevenueCpmUsd,
        placements: ads.placements,
      },
    };
  }
}
