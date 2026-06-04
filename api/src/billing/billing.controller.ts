import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
import { CreatorsBalanceService } from './creators-balance.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateCreatorSubscriptionDto } from './dto/create-creator-subscription.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { SendGiftDto } from './dto/send-gift.dto';

@Controller('billing')
export class BillingController {
  constructor(
    private prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly creatorsBalance: CreatorsBalanceService,
  ) {}

  @Get('products')
  async products() {
    return this.prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  @Get('gifts/catalog')
  async giftCatalog() {
    return this.prisma.giftCatalog.findMany({
      where: { isActive: true },
    });
  }

  /** Stripe sends signed events here — no JWT; configure in Stripe Dashboard. */
  @Post('stripe/webhook')
  stripeWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.billing.handleStripeWebhook(req.rawBody, signature);
  }

  @Post('stripe/create-checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: AuthUserPayload, @Body() body: CreateCheckoutDto) {
    return this.billing.createCheckout(user.id, body);
  }

  @Post('stripe/fulfill')
  @UseGuards(JwtAuthGuard)
  fulfill(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: { sessionId: string },
  ) {
    return this.billing.fulfillCheckoutSession(body.sessionId, user.id);
  }

  @Get('stripe/fulfill')
  @UseGuards(JwtAuthGuard)
  fulfillQuery(
    @CurrentUser() user: AuthUserPayload,
    @Query('session_id') sessionId: string,
  ) {
    return this.billing.fulfillCheckoutSession(sessionId, user.id);
  }

  @Post('subscriptions/create')
  @UseGuards(JwtAuthGuard)
  createCreatorSubscription(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: CreateCreatorSubscriptionDto,
  ) {
    return this.billing.createCreatorSubscriptionCheckout(
      user.id,
      body.creatorId,
      body.tier,
    );
  }

  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  mySubscriptions(@CurrentUser() user: AuthUserPayload) {
    return this.billing.listMySubscriptions(user.id);
  }

  @Delete('subscriptions/:id')
  @UseGuards(JwtAuthGuard)
  cancelSubscription(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') subscriptionId: string,
  ) {
    return this.billing.cancelSubscription(user.id, subscriptionId);
  }

  @Get('creators/balance')
  @UseGuards(JwtAuthGuard)
  creatorBalance(@CurrentUser() user: AuthUserPayload) {
    return this.creatorsBalance.getBalance(user.id);
  }

  @Post('creators/payouts/request')
  @UseGuards(JwtAuthGuard)
  requestPayout(
    @CurrentUser() user: AuthUserPayload,
    @Body() body: RequestPayoutDto,
  ) {
    return this.creatorsBalance.requestPayout(user.id, body);
  }

  @Post('gifts/send')
  @UseGuards(JwtAuthGuard)
  sendGift(@CurrentUser() user: AuthUserPayload, @Body() body: SendGiftDto) {
    return this.billing.sendGift(user.id, body);
  }
}
