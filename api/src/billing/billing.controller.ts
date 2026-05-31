import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('billing')
export class BillingController {
  constructor(private prisma: PrismaService) {}

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
    return { checkoutUrl: null, message: 'Stripe — Week 5' };
  }

  @Post('gifts/send')
  @UseGuards(JwtAuthGuard)
  sendGift() {
    return { success: false, message: 'Gifts — Week 5' };
  }
}
