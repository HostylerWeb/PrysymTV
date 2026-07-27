import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { AdvertisersService } from './advertisers.service';
import { AdvertiserAdMediaUploadDto } from './dto/advertiser-ad-media-upload.dto';
import { CreateAdvertiserCampaignDto } from './dto/create-advertiser-campaign.dto';
import { RegisterAdvertiserDto } from './dto/register-advertiser.dto';
import { UpdateAdvertiserCampaignDto } from './dto/update-advertiser-campaign.dto';

@Controller('advertisers')
@UseGuards(JwtAuthGuard)
export class AdvertisersController {
  constructor(private readonly advertisers: AdvertisersService) {}

  @Post('register')
  register(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: RegisterAdvertiserDto,
  ) {
    return this.advertisers.register(user.id, body);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthUserPayload) {
    return this.advertisers.listMine(user.id);
  }

  @Get('me/:accountId/campaigns/:campaignId/analytics')
  campaignAnalytics(
    @CurrentUser() user: AuthUserPayload,
    @Param('accountId') accountId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.advertisers.getCampaignAnalytics(
      user.id,
      accountId,
      campaignId,
    );
  }

  @Post('me/:accountId/campaigns')
  createCampaign(
    @CurrentUser() user: AuthUserPayload,
    @Param('accountId') accountId: string,
    @Body() body: CreateAdvertiserCampaignDto,
  ) {
    return this.advertisers.createCampaign(user.id, accountId, body);
  }

  @Put('me/:accountId/campaigns/:campaignId')
  updateCampaign(
    @CurrentUser() user: AuthUserPayload,
    @Param('accountId') accountId: string,
    @Param('campaignId') campaignId: string,
    @Body() body: UpdateAdvertiserCampaignDto,
  ) {
    return this.advertisers.updateCampaign(user.id, accountId, campaignId, body);
  }

  @Post('me/:accountId/media/upload')
  initAdMediaUpload(
    @CurrentUser() user: AuthUserPayload,
    @Param('accountId') accountId: string,
    @Body() body: AdvertiserAdMediaUploadDto,
  ) {
    return this.advertisers.initAdMediaUpload(user.id, accountId, body);
  }

  @Get('me/:id')
  getMine(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.advertisers.getMine(user.id, id);
  }

  @Delete('me/:id')
  cancelPending(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.advertisers.cancelPending(user.id, id);
  }
}
