import {
  Body,
  Controller,
  Get,
  Headers,
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
    @Query('peek') peek: string | undefined,
    @Req() req: Request & { user?: AuthUserPayload | null },
  ) {
    const p = placement as AdPlacement;
    if (!Object.values(AdPlacement).includes(p)) {
      return { ad: null, error: 'Invalid placement' };
    }
    return this.ads.serve(p, req.user?.id, {
      peek: peek === '1' || peek === 'true',
    });
  }

  @Post('track/impression')
  trackImpression(
    @Body() body: TrackContentAdDto,
    @Req() req: Request & { user?: AuthUserPayload | null },
    @Headers('x-country-code') countryCode?: string,
  ) {
    return this.analytics.trackContentAd(body, 'ad_impression', req, countryCode);
  }

  @Post('track/click')
  trackClick(
    @Body() body: TrackContentAdDto,
    @Req() req: Request & { user?: AuthUserPayload | null },
    @Headers('x-country-code') countryCode?: string,
  ) {
    return this.analytics.trackContentAd(body, 'ad_click', req, countryCode);
  }
}
