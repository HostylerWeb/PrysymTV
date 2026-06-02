import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdPlacement } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';
import { TrackContentAdDto } from '../analytics/dto/track-content-ad.dto';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly ads: AdsService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('serve')
  async serve(@Query('placement') placement: string) {
    const p = placement as AdPlacement;
    if (!Object.values(AdPlacement).includes(p)) {
      return { ad: null, error: 'Invalid placement' };
    }
    return this.ads.serve(p);
  }

  @Post('track/impression')
  trackImpression(@Body() body: TrackContentAdDto) {
    return this.analytics.trackContentAd(body, 'ad_impression');
  }

  @Post('track/click')
  trackClick(@Body() body: TrackContentAdDto) {
    return this.analytics.trackContentAd(body, 'ad_click');
  }
}
