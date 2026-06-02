import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdCampaignStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { AdminService } from './admin.service';
import { CreateAdCampaignDto } from './dto/create-ad-campaign.dto';
import { UpdateRevenueSplitRuleDto } from './dto/update-revenue-split-rule.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminController {
  constructor(
    private readonly revenueSplit: RevenueSplitService,
    private readonly admin: AdminService,
  ) {}

  @Get('analytics/overview')
  overview() {
    return { message: 'Admin panel — Week 9', dau: 0, revenueToday: 0 };
  }

  @Get('revenue-split-rules')
  listRevenueSplitRules() {
    return this.revenueSplit.listRules();
  }

  @Put('revenue-split-rules/:ruleKey')
  updateRevenueSplitRule(
    @Param('ruleKey') ruleKey: string,
    @Body() body: UpdateRevenueSplitRuleDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.revenueSplit.updateRule(ruleKey, body, admin.id);
  }

  @Get('ads/campaigns')
  listAdCampaigns() {
    return this.admin.listAdCampaigns();
  }

  @Post('ads/campaigns')
  createAdCampaign(@Body() body: CreateAdCampaignDto) {
    return this.admin.createAdCampaign(body);
  }

  @Put('ads/campaigns/:id/status')
  updateCampaignStatus(
    @Param('id') id: string,
    @Body() body: { status: AdCampaignStatus },
  ) {
    return this.admin.updateAdCampaignStatus(id, body.status);
  }
}
