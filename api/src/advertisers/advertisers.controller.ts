import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { AdvertisersService } from './advertisers.service';
import { RegisterAdvertiserDto } from './dto/register-advertiser.dto';

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

  @Get('me/:id')
  getMine(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.advertisers.getMine(user.id, id);
  }

  @Delete('me/:id')
  cancelPending(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.advertisers.cancelPending(user.id, id);
  }
}
