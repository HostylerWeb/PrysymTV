import { apiRequest } from './client';

export function fetchBillingProducts() {
  return apiRequest<unknown[]>('/billing/products', { auth: false });
}

export function fetchGiftsCatalog() {
  return apiRequest<unknown[]>('/billing/gifts/catalog', { auth: false });
}

export function createStripeCheckout(body: {
  packageId?: string;
  productType: 'coins' | 'premium' | 'insider';
}) {
  return apiRequest<{ url: string; sessionId?: string }>('/billing/stripe/create-checkout', {
    method: 'POST',
    body,
  });
}

export function fulfillStripeCheckout(sessionId: string) {
  return apiRequest<unknown>('/billing/stripe/fulfill', {
    method: 'POST',
    body: { sessionId },
  });
}

export function sendGift(body: {
  giftId: string;
  receiverId: string;
  streamId?: string;
  videoId?: string;
}) {
  return apiRequest<unknown>('/billing/gifts/send', { method: 'POST', body });
}

export function createChannelSubscription(body: { creatorId: string; tier: 'basic' | 'premium' }) {
  return apiRequest<unknown>('/billing/subscriptions/create', { method: 'POST', body });
}

export function fetchMySubscriptions() {
  return apiRequest<unknown[]>('/billing/subscriptions/me');
}
