import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SendGiftDto } from './dto/send-gift.dto';

@Controller('billing')
export class BillingController {
  constructor(
    private prisma: PrismaService,
    private readonly billing: BillingService,
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
    return this.billing.fulfillCheckoutSession(body.sessionId);
  }

  @Get('stripe/fulfill')
  @UseGuards(JwtAuthGuard)
  fulfillQuery(
    @CurrentUser() _user: AuthUserPayload,
    @Query('session_id') sessionId: string,
  ) {
    return this.billing.fulfillCheckoutSession(sessionId);
  }

  @Post('gifts/send')
  @UseGuards(JwtAuthGuard)
  sendGift(@CurrentUser() user: AuthUserPayload, @Body() body: SendGiftDto) {
    return this.billing.sendGift(user.id, body);
  }
}
