import { apiRequest } from './client';

export type CoinPackage = {
  id: string;
  coins: number;
  priceUsd: number | string;
  label: string;
};

export type GiftCatalogItem = {
  id: string;
  name: string;
  coinCost: number;
  animationKey: string;
  imageUrl?: string | null;
};

export type CheckoutResult = {
  checkoutUrl?: string;
  devMode?: boolean;
  coinsAdded?: number;
  coinsBalance?: number;
  premiumTier?: string;
  premiumExpiresAt?: string | null;
  insiderActive?: boolean;
  insiderPeriodEnd?: string | null;
  sessionId?: string;
  success?: boolean;
  subscriptionId?: string;
  currentPeriodEnd?: string;
};

export type SubscriptionCheckoutResult = CheckoutResult;

export function fetchBillingProducts() {
  return apiRequest<CoinPackage[]>('/billing/products', { auth: false });
}

export function fetchGiftsCatalog() {
  return apiRequest<GiftCatalogItem[]>('/billing/gifts/catalog', { auth: false });
}

export function createCoinCheckout(packageId: string) {
  return createStripeCheckout({ packageId, productType: 'coins' });
}

export function createPremiumCheckout(packageId = 'premium') {
  return createStripeCheckout({ packageId, productType: 'premium' });
}

export function createInsiderCheckout() {
  return createStripeCheckout({ packageId: 'insider', productType: 'insider' });
}

export function createStripeCheckout(body: {
  packageId?: string;
  productType: 'coins' | 'premium' | 'insider';
}) {
  return apiRequest<CheckoutResult>('/billing/stripe/create-checkout', {
    method: 'POST',
    body,
  });
}

export function fulfillCheckout(sessionId: string) {
  return apiRequest<CheckoutResult>(
    `/billing/stripe/fulfill?session_id=${encodeURIComponent(sessionId)}`,
  );
}

/** @deprecated Use fulfillCheckout */
export function fulfillStripeCheckout(sessionId: string) {
  return fulfillCheckout(sessionId);
}

export function sendGift(body: {
  giftId: string;
  receiverId: string;
  streamId?: string;
  videoId?: string;
}) {
  return apiRequest<{
    success: boolean;
    coinsSpent: number;
    coinsRemaining: number;
  }>('/billing/gifts/send', { method: 'POST', body });
}

export function fetchMySubscriptions() {
  return apiRequest<{ items: import('./billing-monetization').CreatorSubscription[] }>(
    '/billing/subscriptions/me',
  );
}

export function cancelSubscription(subscriptionId: string) {
  return apiRequest<{ success: boolean; status: string }>(
    `/billing/subscriptions/${subscriptionId}`,
    { method: 'DELETE' },
  );
}

export function createChannelSubscription(body: { creatorId: string; tier: 'basic' | 'premium' }) {
  return apiRequest<SubscriptionCheckoutResult>('/billing/subscriptions/create', {
    method: 'POST',
    body,
  });
}
