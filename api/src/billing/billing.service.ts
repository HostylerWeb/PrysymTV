import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  Prisma,
  RevenueSourceType,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SendGiftDto } from './dto/send-gift.dto';

const COIN_USD = new Prisma.Decimal('0.01');

@Injectable()
export class BillingService {
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly revenueSplit: RevenueSplitService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    const pkg = await this.prisma.coinPackage.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg?.isActive) throw new NotFoundException('Coin package not found');

    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    if (!this.stripe) {
      await this.grantCoins(userId, pkg.id, pkg.coins, Number(pkg.priceUsd));
      return {
        success: true,
        devMode: true,
        coinsAdded: pkg.coins,
        coinsBalance: (
          await this.prisma.user.findUnique({
            where: { id: userId },
            select: { coinsBalance: true },
          })
        )?.coinsBalance,
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${frontend}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontend}/profile?checkout=cancelled`,
      metadata: {
        userId,
        packageId: pkg.id,
        coins: String(pkg.coins),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(pkg.priceUsd) * 100),
            product_data: {
              name: `Prysym TV — ${pkg.label} (${pkg.coins} coins)`,
            },
          },
        },
      ],
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.purchase_coins,
        provider: PaymentProvider.stripe,
        providerTransactionId: session.id,
        amountUsd: pkg.priceUsd,
        coinsAdded: pkg.coins,
        status: TransactionStatus.pending,
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async fulfillCheckoutSession(sessionId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }
    const userId = session.metadata?.userId;
    const packageId = session.metadata?.packageId;
    if (!userId || !packageId) {
      throw new BadRequestException('Invalid session metadata');
    }
    const pkg = await this.prisma.coinPackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const existing = await this.prisma.transaction.findFirst({
      where: {
        providerTransactionId: sessionId,
        status: TransactionStatus.completed,
      },
    });
    if (existing) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { coinsBalance: true },
      });
      return { success: true, coinsBalance: user?.coinsBalance ?? 0, alreadyFulfilled: true };
    }

    await this.grantCoins(userId, pkg.id, pkg.coins, Number(pkg.priceUsd), sessionId);

    await this.prisma.transaction.updateMany({
      where: { providerTransactionId: session.id, userId },
      data: { status: TransactionStatus.completed },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true },
    });
    return { success: true, coinsBalance: user?.coinsBalance ?? 0 };
  }

  private async grantCoins(
    userId: string,
    packageId: string,
    coins: number,
    amountUsd: number,
    providerTransactionId?: string,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { coinsBalance: { increment: coins } },
    });

    const tx = await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.purchase_coins,
        provider: this.stripe ? PaymentProvider.stripe : PaymentProvider.stripe,
        providerTransactionId:
          providerTransactionId ?? `dev-${packageId}-${Date.now()}`,
        amountUsd: amountUsd,
        coinsAdded: coins,
        status: TransactionStatus.completed,
      },
    });

    await this.revenueSplit.distributeAndPersist({
      ruleKey: 'coin_purchase',
      sourceType: RevenueSourceType.coin_purchase,
      sourceId: tx.id,
      grossAmountUsd: amountUsd,
      metadata: { packageId, coins },
    });
  }

  async sendGift(senderId: string, dto: SendGiftDto) {
    const catalog = await this.prisma.giftCatalog.findUnique({
      where: { id: dto.giftId },
    });
    if (!catalog?.isActive) throw new NotFoundException('Gift not found');

    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!sender) throw new NotFoundException('Sender not found');
    if (sender.coinsBalance < catalog.coinCost) {
      throw new BadRequestException('Insufficient coins');
    }

    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

    const grossUsd = COIN_USD.mul(catalog.coinCost);

    const gift = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: senderId },
        data: { coinsBalance: { decrement: catalog.coinCost } },
      });
      return tx.gift.create({
        data: {
          senderId,
          receiverId: dto.receiverId,
          streamId: dto.streamId,
          videoId: dto.videoId,
          giftType: catalog.id,
          coinValue: catalog.coinCost,
        },
      });
    });

    const { batch } = await this.revenueSplit.distributeAndPersist({
      ruleKey: 'viewer_support',
      sourceType: RevenueSourceType.gift,
      sourceId: gift.id,
      grossAmountUsd: grossUsd,
      creatorId: dto.receiverId,
      metadata: { giftId: catalog.id, coins: catalog.coinCost },
    });

    await this.prisma.gift.update({
      where: { id: gift.id },
      data: { revenueBatchId: batch.id },
    });

    const updatedSender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { coinsBalance: true },
    });

    return {
      success: true,
      giftId: gift.id,
      coinsSpent: catalog.coinCost,
      coinsRemaining: updatedSender?.coinsBalance ?? 0,
    };
  }
}
