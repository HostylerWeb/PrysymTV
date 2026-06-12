import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PremiumTier,
  Prisma,
  RevenueSourceType,
  SubscriptionStatus,
  SubscriptionTier,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import Stripe from 'stripe';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RevenueSplitService } from '../revenue/revenue-split.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SendGiftDto } from './dto/send-gift.dto';

const COIN_USD = new Prisma.Decimal('0.01');

/** Single platform membership — ad-free on Shorts, Verticals, and Movies. */
const PREMIUM_PLANS: Record<
  string,
  { tier: PremiumTier; priceUsd: number; label: string }
> = {
  membership: { tier: PremiumTier.premium, priceUsd: 4.99, label: 'Prysym Membership' },
  premium: { tier: PremiumTier.premium, priceUsd: 4.99, label: 'Prysym Membership' },
};

const PREMIUM_DURATION_DAYS = 30;
const CREATOR_SUB_DURATION_DAYS = 30;

/** Paid channel membership (distinct from free Follow and platform Premium ad-free). */
const CREATOR_SUB_PLANS: Record<
  string,
  { tier: SubscriptionTier; priceUsd: number; label: string }
> = {
  basic: {
    tier: SubscriptionTier.basic,
    priceUsd: 4.99,
    label: 'Channel Member — 30 days',
  },
  premium: {
    tier: SubscriptionTier.premium,
    priceUsd: 9.99,
    label: 'Channel VIP — 30 days',
  },
};

@Injectable()
export class BillingService {
  private stripe: InstanceType<typeof Stripe> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
    private readonly revenueSplit: RevenueSplitService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key);
    }
  }

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    if (dto.productType === 'premium') {
      return this.createPremiumCheckout(userId, dto.packageId);
    }
    return this.createCoinCheckout(userId, dto.packageId);
  }

  async createCreatorSubscriptionCheckout(
    subscriberId: string,
    creatorId: string,
    tierKey: string,
  ) {
    if (subscriberId === creatorId) {
      throw new BadRequestException('Cannot subscribe to yourself');
    }
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { id: true, username: true, isBanned: true },
    });
    if (!creator || creator.isBanned) {
      throw new NotFoundException('Creator not found');
    }

    const plan = CREATOR_SUB_PLANS[tierKey];
    if (!plan) throw new NotFoundException('Subscription tier not found');

    const existing = await this.findActiveCreatorSubscription(
      subscriberId,
      creatorId,
    );
    if (existing) {
      throw new BadRequestException('You already have an active membership');
    }

    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    if (!this.stripe) {
      const sub = await this.grantCreatorSubscription({
        subscriberId,
        creatorId,
        tier: plan.tier,
        amountUsd: plan.priceUsd,
      });
      return {
        success: true,
        devMode: true,
        subscriptionId: sub.id,
        currentPeriodEnd: sub.currentPeriodEnd,
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${frontend}/creator/${creator.username}?checkout=success&session_id={CHECKOUT_SESSION_ID}&product=creator_sub`,
      cancel_url: `${frontend}/creator/${creator.username}?checkout=cancelled`,
      metadata: {
        userId: subscriberId,
        creatorId,
        productType: 'creator_subscription',
        tier: plan.tier,
        tierKey,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(plan.priceUsd * 100),
            product_data: { name: `${plan.label} — @${creator.username}` },
          },
        },
      ],
    });

    await this.prisma.transaction.create({
      data: {
        userId: subscriberId,
        type: TransactionType.subscription,
        provider: PaymentProvider.stripe,
        providerTransactionId: session.id,
        amountUsd: plan.priceUsd,
        status: TransactionStatus.pending,
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async listMySubscriptions(subscriberId: string) {
    const rows = await this.prisma.subscription.findMany({
      where: {
        subscriberId,
        creatorId: { not: null },
        status: SubscriptionStatus.active,
        currentPeriodEnd: { gt: new Date() },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { currentPeriodEnd: 'desc' },
    });
    return {
      items: rows.map((s) => ({
        id: s.id,
        tier: s.tier,
        status: s.status,
        currentPeriodEnd: s.currentPeriodEnd.toISOString(),
        creator: s.creator,
      })),
    };
  }

  async cancelSubscription(subscriberId: string, subscriptionId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, subscriberId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (!sub.creatorId) {
      throw new BadRequestException('Not a creator membership');
    }
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.cancelled },
    });
    return { success: true, status: SubscriptionStatus.cancelled };
  }

  async isActiveCreatorMember(subscriberId: string, creatorId: string) {
    const sub = await this.findActiveCreatorSubscription(subscriberId, creatorId);
    return !!sub;
  }

  private async findActiveCreatorSubscription(
    subscriberId: string,
    creatorId: string,
  ) {
    return this.prisma.subscription.findFirst({
      where: {
        subscriberId,
        creatorId,
        status: SubscriptionStatus.active,
        currentPeriodEnd: { gt: new Date() },
      },
    });
  }

  private async createCoinCheckout(userId: string, packageId: string) {
    const pkg = await this.prisma.coinPackage.findUnique({
      where: { id: packageId },
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
      success_url: `${frontend}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}&product=coins`,
      cancel_url: `${frontend}/profile?checkout=cancelled`,
      metadata: {
        userId,
        packageId: pkg.id,
        productType: 'coins',
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

  private async resolvePremiumPlan(tierId: string) {
    const plan = PREMIUM_PLANS[tierId];
    if (!plan) return null;
    const priceUsd = await this.platformSettings.getMembershipPriceUsd();
    return { ...plan, priceUsd };
  }

  private async createPremiumCheckout(userId: string, tierId: string) {
    const plan = await this.resolvePremiumPlan(tierId);
    if (!plan) throw new NotFoundException('Premium plan not found');

    const frontend = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');

    if (!this.stripe) {
      await this.grantPremium(userId, plan.tier, plan.priceUsd);
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { premiumTier: true, premiumExpiresAt: true },
      });
      return {
        success: true,
        devMode: true,
        premiumTier: user?.premiumTier,
        premiumExpiresAt: user?.premiumExpiresAt,
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${frontend}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}&product=premium`,
      cancel_url: `${frontend}/profile?checkout=cancelled`,
      metadata: {
        userId,
        productType: 'premium',
        tier: plan.tier,
        packageId: tierId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(plan.priceUsd * 100),
            product_data: {
              name: `${plan.label} — 30 days`,
            },
          },
        },
      ],
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.subscription,
        provider: PaymentProvider.stripe,
        providerTransactionId: session.id,
        amountUsd: plan.priceUsd,
        status: TransactionStatus.pending,
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async handleStripeWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
    }
    if (!rawBody?.length || !signature) {
      throw new BadRequestException('Missing webhook body or signature');
    }

    let event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (
        session &&
        typeof session === 'object' &&
        'payment_status' in session &&
        session.payment_status === 'paid' &&
        'id' in session &&
        typeof session.id === 'string'
      ) {
        await this.fulfillCheckoutSession(session.id);
      }
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      if (
        session &&
        typeof session === 'object' &&
        'id' in session &&
        typeof session.id === 'string'
      ) {
        await this.fulfillCheckoutSession(session.id);
      }
    }

    return { received: true };
  }

  async fulfillCheckoutSession(sessionId: string, expectedUserId?: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }
    const userId = session.metadata?.userId;
    const productType = session.metadata?.productType ?? 'coins';
    if (!userId) {
      throw new BadRequestException('Invalid session metadata');
    }
    if (expectedUserId && expectedUserId !== userId) {
      throw new BadRequestException('Checkout session does not belong to this user');
    }

    const existing = await this.prisma.transaction.findFirst({
      where: {
        providerTransactionId: sessionId,
        status: TransactionStatus.completed,
      },
    });
    if (existing) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { coinsBalance: true, premiumTier: true, premiumExpiresAt: true },
      });
      return {
        success: true,
        alreadyFulfilled: true,
        coinsBalance: user?.coinsBalance ?? 0,
        premiumTier: user?.premiumTier,
        premiumExpiresAt: user?.premiumExpiresAt,
      };
    }

    if (productType === 'premium') {
      const tier = session.metadata?.tier as PremiumTier | undefined;
      const packageId = session.metadata?.packageId ?? 'premium';
      const plan = tier ? await this.resolvePremiumPlan(packageId) : null;
      if (!tier) throw new BadRequestException('Invalid premium metadata');
      const prices = await this.platformSettings.getPremiumPrices();
      await this.grantPremium(
        userId,
        tier,
        plan?.priceUsd ?? prices.premium,
        sessionId,
      );
    } else if (productType === 'creator_subscription') {
      const creatorId = session.metadata?.creatorId;
      const tier = session.metadata?.tier as SubscriptionTier | undefined;
      if (!creatorId || !tier) {
        throw new BadRequestException('Invalid creator subscription metadata');
      }
      const tierKey = session.metadata?.tierKey ?? 'basic';
      const plan = CREATOR_SUB_PLANS[tierKey] ?? { priceUsd: 4.99 };
      await this.grantCreatorSubscription({
        subscriberId: userId,
        creatorId,
        tier,
        amountUsd: plan.priceUsd,
        stripeSessionId: sessionId,
      });
    } else {
      const packageId = session.metadata?.packageId;
      if (!packageId) throw new BadRequestException('Invalid session metadata');
      const pkg = await this.prisma.coinPackage.findUnique({
        where: { id: packageId },
      });
      if (!pkg) throw new NotFoundException('Package not found');
      await this.grantCoins(userId, pkg.id, pkg.coins, Number(pkg.priceUsd), sessionId);
    }

    await this.prisma.transaction.updateMany({
      where: { providerTransactionId: session.id, userId },
      data: { status: TransactionStatus.completed },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true, premiumTier: true, premiumExpiresAt: true },
    });
    return {
      success: true,
      coinsBalance: user?.coinsBalance ?? 0,
      premiumTier: user?.premiumTier,
      premiumExpiresAt: user?.premiumExpiresAt,
    };
  }

  private async grantPremium(
    userId: string,
    tier: PremiumTier,
    amountUsd: number,
    providerTransactionId?: string,
  ) {
    const expires = new Date();
    expires.setDate(expires.getDate() + PREMIUM_DURATION_DAYS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        premiumTier: tier,
        premiumExpiresAt: expires,
      },
    });

    const txId =
      providerTransactionId ?? `dev-premium-${tier}-${Date.now()}`;

    let tx = providerTransactionId
      ? await this.prisma.transaction.findFirst({
          where: { providerTransactionId },
        })
      : null;

    if (!tx) {
      tx = await this.prisma.transaction.create({
        data: {
          userId,
          type: TransactionType.subscription,
          provider: PaymentProvider.stripe,
          providerTransactionId: txId,
          amountUsd: amountUsd,
          status: TransactionStatus.completed,
        },
      });
    }

    const batchExists = await this.prisma.revenueLedgerBatch.findFirst({
      where: {
        sourceId: tx.id,
        sourceType: RevenueSourceType.platform_subscription,
      },
    });
    if (!batchExists) {
      await this.revenueSplit.distributeAndPersist({
        ruleKey: 'insider_membership',
        sourceType: RevenueSourceType.platform_subscription,
        sourceId: tx.id,
        grossAmountUsd: amountUsd,
        metadata: { tier, product: 'platform_premium' },
      });
    }
  }

  private async grantCreatorSubscription(params: {
    subscriberId: string;
    creatorId: string;
    tier: SubscriptionTier;
    amountUsd: number;
    stripeSessionId?: string;
  }) {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + CREATOR_SUB_DURATION_DAYS);

    const existing = await this.findActiveCreatorSubscription(
      params.subscriberId,
      params.creatorId,
    );
    if (existing) return existing;

    const sub = await this.prisma.subscription.create({
      data: {
        subscriberId: params.subscriberId,
        creatorId: params.creatorId,
        tier: params.tier,
        status: SubscriptionStatus.active,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: params.stripeSessionId,
      },
    });

    const providerTxId =
      params.stripeSessionId ??
      `dev-creator-sub-${params.creatorId}-${Date.now()}`;

    let tx = params.stripeSessionId
      ? await this.prisma.transaction.findFirst({
          where: { providerTransactionId: params.stripeSessionId },
        })
      : null;

    if (!tx) {
      tx = await this.prisma.transaction.create({
        data: {
          userId: params.subscriberId,
          type: TransactionType.subscription,
          provider: PaymentProvider.stripe,
          providerTransactionId: providerTxId,
          amountUsd: params.amountUsd,
          status: TransactionStatus.completed,
        },
      });
    }

    const batchExists = await this.prisma.revenueLedgerBatch.findFirst({
      where: {
        sourceId: sub.id,
        sourceType: RevenueSourceType.creator_subscription,
      },
    });
    if (!batchExists) {
      await this.revenueSplit.distributeAndPersist({
        ruleKey: 'creator_subscription',
        sourceType: RevenueSourceType.creator_subscription,
        sourceId: sub.id,
        grossAmountUsd: params.amountUsd,
        creatorId: params.creatorId,
        metadata: { tier: params.tier, transactionId: tx.id },
      });
    }

    return sub;
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

    void this.notifications.notifyGift(
      dto.receiverId,
      senderId,
      dto.streamId,
      catalog.name,
    );

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
