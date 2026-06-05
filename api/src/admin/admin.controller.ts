import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdCampaignStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { AdminService } from './admin.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateAdCampaignDto } from './dto/create-ad-campaign.dto';
import { ProcessPayoutDto } from './dto/process-payout.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReviewStreamerApplicationDto } from './dto/review-streamer-application.dto';
import { UpdatePartnerTierDto } from './dto/update-partner-tier.dto';
import { UpdateRevenueSplitRuleDto } from './dto/update-revenue-split-rule.dto';
import { VerifyUserDto } from './dto/verify-user.dto';
import { UpdateAdsConfigDto } from './dto/update-ads-config.dto';
import { UpdateAnalyticsConfigDto } from './dto/update-analytics-config.dto';
import { UpdateEconomyConfigDto } from './dto/update-economy-config.dto';
import { UpdateScorecardConfigDto } from './dto/update-scorecard-config.dto';
import { UpsertCoinPackageDto } from './dto/upsert-coin-package.dto';
import { UpsertGiftCatalogDto } from './dto/upsert-gift-catalog.dto';
import type { ProgramConfigEntry } from '../platform-settings/platform-settings.types';

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
    return this.admin.getOverview();
  }

  @Get('reports')
  listReports(@Query() query: AdminListQueryDto) {
    return this.admin.listReports(query);
  }

  @Get('reports/:id')
  getReport(@Param('id') id: string) {
    return this.admin.getReport(id);
  }

  @Put('reports/:id')
  reviewReport(
    @Param('id') id: string,
    @Body() body: ReviewReportDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.reviewReport(id, admin.id, body.action, body.notes);
  }

  @Get('users')
  listUsers(@Query() query: AdminListQueryDto) {
    return this.admin.listUsers(query);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Put('users/:id/ban')
  banUser(@Param('id') id: string, @Body() body: BanUserDto) {
    return this.admin.setUserBanned(id, body.banned);
  }

  @Put('users/:id/verify')
  verifyUser(@Param('id') id: string, @Body() body: VerifyUserDto) {
    return this.admin.setUserVerified(id, body.verified);
  }

  @Put('users/:id/partner-tier')
  updatePartnerTier(@Param('id') id: string, @Body() body: UpdatePartnerTierDto) {
    return this.admin.setPartnerTier(id, body.partnerTier);
  }

  @Put('users/:id/coins')
  adjustCoins(
    @Param('id') id: string,
    @Body() body: { delta: number },
  ) {
    return this.admin.adjustUserCoins(id, body.delta);
  }

  @Get('streamer-applications')
  listStreamerApplications(@Query() query: AdminListQueryDto) {
    return this.admin.listStreamerApplications(query);
  }

  @Get('streamer-applications/:id')
  getStreamerApplication(@Param('id') id: string) {
    return this.admin.getStreamerApplication(id);
  }

  @Put('streamer-applications/:id')
  reviewStreamerApplication(
    @Param('id') id: string,
    @Body() body: ReviewStreamerApplicationDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.reviewStreamerApplication(
      id,
      admin.id,
      body.action,
      body.notes,
    );
  }

  @Get('payouts')
  listPayouts(@Query() query: AdminListQueryDto) {
    return this.admin.listPayouts(query);
  }

  @Put('payouts/:id')
  processPayout(
    @Param('id') id: string,
    @Body() body: ProcessPayoutDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.processPayout(id, admin.id, body.action);
  }

  @Get('live-streams')
  listLiveStreams() {
    return this.admin.listLiveStreams();
  }

  @Get('stream-history')
  listStreamHistory(@Query() query: AdminListQueryDto) {
    return this.admin.listStreamHistory(query);
  }

  @Get('revenue/ledger')
  listRevenueLedger(@Query() query: AdminListQueryDto) {
    return this.admin.listRevenueLedger(query);
  }

  @Post('streams/:id/kill')
  killStream(@Param('id') id: string) {
    return this.admin.killStream(id);
  }

  @Delete('videos/:id')
  deleteVideo(@Param('id') id: string) {
    return this.admin.deleteVideo(id);
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: string) {
    return this.admin.deleteComment(id);
  }

  @Get('content/stats')
  contentStats() {
    return this.admin.getContentStats();
  }

  @Get('content/videos')
  listVideos(@Query() query: AdminListQueryDto) {
    return this.admin.listAdminVideos(query);
  }

  @Get('content/comments')
  listComments(@Query() query: AdminListQueryDto) {
    return this.admin.listAdminComments(query);
  }

  @Get('content/vertical-series')
  listVerticalSeries(@Query() query: AdminListQueryDto) {
    return this.admin.listAdminVerticalSeries(query);
  }

  @Get('content/vertical-series/:slug/episodes')
  listVerticalEpisodes(
    @Param('slug') slug: string,
    @Query() query: AdminListQueryDto,
  ) {
    return this.admin.listAdminVerticalEpisodes(slug, query);
  }

  @Get('content/podcast-shows')
  listPodcastShows(@Query() query: AdminListQueryDto) {
    return this.admin.listAdminPodcastShows(query);
  }

  @Get('content/podcast-shows/:showId/episodes')
  listPodcastEpisodes(
    @Param('showId') showId: string,
    @Query() query: AdminListQueryDto,
  ) {
    return this.admin.listAdminPodcastEpisodes(showId, query);
  }

  @Delete('vertical-episodes/:id')
  deleteVerticalEpisode(@Param('id') id: string) {
    return this.admin.deleteVerticalEpisode(id);
  }

  @Delete('podcast-episodes/:id')
  deletePodcastEpisode(@Param('id') id: string) {
    return this.admin.deletePodcastEpisode(id);
  }

  @Get('config/economy')
  economyConfig() {
    return this.admin.getEconomyConfig();
  }

  @Put('config/economy')
  updateEconomyConfig(
    @Body() body: UpdateEconomyConfigDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.updateEconomyConfig(admin.id, body);
  }

  @Get('config/ads')
  adsConfig() {
    return this.admin.getAdsConfig();
  }

  @Put('config/ads')
  updateAdsConfig(
    @Body() body: UpdateAdsConfigDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.updateAdsConfig(admin.id, body);
  }

  @Get('config/analytics')
  analyticsConfig() {
    return this.admin.getAnalyticsConfig();
  }

  @Put('config/analytics')
  updateAnalyticsConfig(
    @Body() body: UpdateAnalyticsConfigDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.updateAnalyticsConfig(admin.id, body);
  }

  @Get('config/scorecard')
  scorecardConfig() {
    return this.admin.getScorecardConfig();
  }

  @Put('config/scorecard')
  updateScorecardConfig(
    @Body() body: UpdateScorecardConfigDto,
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.updateScorecardConfig(admin.id, body);
  }

  @Get('config/programs')
  programsConfig() {
    return this.admin.getProgramsConfig();
  }

  @Put('config/programs')
  updateProgramsConfig(
    @Body() body: { programs: ProgramConfigEntry[] },
    @CurrentUser() admin: AuthUserPayload,
  ) {
    return this.admin.updateProgramsConfig(admin.id, body.programs);
  }

  @Put('coin-packages')
  upsertCoinPackage(@Body() body: UpsertCoinPackageDto) {
    return this.admin.upsertCoinPackage(body);
  }

  @Delete('coin-packages/:id')
  deleteCoinPackage(@Param('id') id: string) {
    return this.admin.deleteCoinPackage(id);
  }

  @Put('gift-catalog')
  upsertGiftCatalog(@Body() body: UpsertGiftCatalogDto) {
    return this.admin.upsertGiftCatalog(body);
  }

  @Delete('gift-catalog/:id')
  deleteGiftCatalog(@Param('id') id: string) {
    return this.admin.deleteGiftCatalog(id);
  }

  @Get('economy/gifts')
  giftActivity(@Query() query: AdminListQueryDto) {
    return this.admin.listGiftActivity(query);
  }

  @Get('economy/transactions')
  transactions(@Query() query: AdminListQueryDto) {
    return this.admin.listTransactions(query);
  }

  @Get('ads/campaigns/:id')
  getAdCampaign(@Param('id') id: string) {
    return this.admin.getAdCampaign(id);
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
