import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdPlacement } from '@prisma/client';
import { Request } from 'express';
import { AnalyticsService } from '../analytics/analytics.service';
import { TrackContentAdDto } from '../analytics/dto/track-content-ad.dto';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { AdsService } from './ads.service';

@Controller('ads')
export class AdsController {
  constructor(
    private readonly ads: AdsService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('serve')
  @UseGuards(OptionalJwtAuthGuard)
  async serve(
    @Query('placement') placement: string,
    @Req() req: Request & { user?: AuthUserPayload | null },
  ) {
    const p = placement as AdPlacement;
    if (!Object.values(AdPlacement).includes(p)) {
      return { ad: null, error: 'Invalid placement' };
    }
    return this.ads.serve(p, req.user?.id);
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
