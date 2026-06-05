import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { AnalyticsService } from './analytics.service';
import { TrackEventsDto } from './dto/track-events.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('track')
  @UseGuards(OptionalJwtAuthGuard)
  track(
    @Req() req: Request & { user?: AuthUserPayload | null },
    @Body() body: TrackEventsDto,
  ) {
    return this.analytics.trackBatch(req.user?.id, body);
  }

  /** Creator Impact Dashboard™ — performance, ad views on your videos, revenue, impact. */
  @Get('creators/me/dashboard')
  @UseGuards(JwtAuthGuard)
  getMyDashboard(@CurrentUser() user: AuthUserPayload) {
    return this.analytics.getCreatorDashboard(user.id);
  }

  @Get('creators/me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@CurrentUser() user: AuthUserPayload) {
    const dash = await this.analytics.getCreatorDashboard(user.id);
    return {
      performance: dash.performance,
      advertising: dash.advertising,
      financial: dash.financial,
      topContent: dash.topContent,
    };
  }

  @Get('creators/me/content')
  @UseGuards(JwtAuthGuard)
  getMyContentStats(@CurrentUser() user: AuthUserPayload) {
    return this.analytics.getCreatorDashboard(user.id).then((d) => ({
      items: d.content,
    }));
  }

  @Get('creators/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.creator, UserRole.admin)
  creatorStatsLegacy(@CurrentUser() user: AuthUserPayload) {
    return this.analytics.getCreatorDashboard(user.id).then((d) => ({
      views24h: d.performance.views24h,
      views7d: d.performance.views7d,
      views30d: d.performance.views30d,
      earnings30d: d.financial.earnings30dUsd,
      adImpressions30d: d.advertising.adImpressionsOnYourContent30d,
      topContent: d.topContent,
    }));
  }
}
