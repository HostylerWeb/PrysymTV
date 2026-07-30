import { apiRequest } from './client';
import type { SubscriptionCheckoutResult } from './billing';

export type CreatorBalance = {
  availableUsd: string;
  minimumPayoutUsd: string;
  lifetimeCreditsUsd: string;
  pendingPayouts: Array<{
    id: string;
    amountUsd: string;
    status: string;
    method: string;
    createdAt: string;
  }>;
};

export type CreatorSubscription = {
  id: string;
  tier: string;
  status: string;
  currentPeriodEnd: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

export function fetchCreatorBalance() {
  return apiRequest<CreatorBalance>('/billing/creators/balance');
}

export function fetchCreatorPayoutProfile() {
  return apiRequest<Record<string, unknown> | null>('/billing/creators/payout-profile');
}

export function updateCreatorPayoutProfile(body: { method: string; details: Record<string, unknown> }) {
  return apiRequest<unknown>('/billing/creators/payout-profile', { method: 'PUT', body });
}

export function requestCreatorPayout(amountUsd: number) {
  return apiRequest<unknown>('/billing/creators/payouts/request', {
    method: 'POST',
    body: { amountUsd },
  });
}

export function fetchMyCreatorSubscriptions() {
  return apiRequest<{ items: CreatorSubscription[] }>('/billing/subscriptions/me');
}

export function createCreatorSubscriptionCheckout(
  creatorId: string,
  tier: 'basic' | 'premium' = 'basic',
) {
  return apiRequest<SubscriptionCheckoutResult>(
    '/billing/subscriptions/create',
    {
      method: 'POST',
      body: { creatorId, tier },
    },
  );
}

export function cancelCreatorSubscription(subscriptionId: string) {
  return apiRequest<{ success: boolean; status: string }>(
    `/billing/subscriptions/${subscriptionId}`,
    { method: 'DELETE' },
  );
}
