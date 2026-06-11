import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

/** Public, cache-friendly config for consumer apps (no secrets). */
@Controller('config')
export class ConfigController {
  constructor(
    private readonly platformSettings: PlatformSettingsService,
    private readonly analytics: AnalyticsService,
  ) {}

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
