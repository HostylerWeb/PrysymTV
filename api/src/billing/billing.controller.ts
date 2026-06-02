import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUserPayload } from '../common/types/auth-user.payload';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from './billing.service';
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
  checkout() {
    return { checkoutUrl: null, message: 'Stripe checkout — configure STRIPE_SECRET_KEY' };
  }

  @Post('gifts/send')
  @UseGuards(JwtAuthGuard)
  sendGift(@CurrentUser() user: AuthUserPayload, @Body() body: SendGiftDto) {
    return this.billing.sendGift(user.id, body);
  }
}
