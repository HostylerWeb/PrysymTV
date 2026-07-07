import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PushService } from './push.service';
import {
  RegisterPushSubscriptionDto,
  UnregisterPushSubscriptionDto,
} from './dto/register-push-subscription.dto';

@Controller()
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('push/vapid-public-key')
  getVapidPublicKey() {
    const publicKey = this.push.getPublicKey();
    return { enabled: Boolean(publicKey), publicKey };
  }

  @Get('users/me/push-subscription')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser() user: AuthUserPayload) {
    const subscribed = await this.push.hasSubscription(user.id);
    return { subscribed, enabled: this.push.isEnabled() };
  }

  @Post('users/me/push-subscription')
  @UseGuards(JwtAuthGuard)
  register(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: RegisterPushSubscriptionDto,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    return this.push.registerSubscription(
      user.id,
      dto,
      typeof userAgent === 'string' ? userAgent : undefined,
    );
  }

  @Delete('users/me/push-subscription')
  @UseGuards(JwtAuthGuard)
  unregister(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UnregisterPushSubscriptionDto,
  ) {
    return this.push.unregisterSubscription(user.id, dto.endpoint);
  }
}
