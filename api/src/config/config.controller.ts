import { Controller, Get } from '@nestjs/common';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

/** Public, cache-friendly config for consumer apps (no secrets). */
@Controller('config')
export class ConfigController {
  constructor(private readonly platformSettings: PlatformSettingsService) {}

  @Get('public')
  async publicConfig() {
    const ads = await this.platformSettings.getAds();
    return {
      ads: {
        shortsInterstitialEveryNSwipes: ads.shortsInterstitialEveryNSwipes,
        shortsInterstitialEnabled: ads.placements.shorts_interstitial,
        shortsSkipSeconds: ads.shortsSkipSeconds,
        moviePrerollSkipSeconds: ads.moviePrerollSkipSeconds,
        placements: ads.placements,
      },
    };
  }
}
