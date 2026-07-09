import { apiRequest } from './client';

export function fetchCreatorBalance() {
  return apiRequest<Record<string, unknown>>('/billing/creators/balance');
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
