import { SubscriptionTier } from '@prisma/client';

/** Paid channel membership (distinct from free Follow and platform ad-free Premium). */
export const CREATOR_SUB_PLANS: Record<
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
