import { apiRequest } from './client';

export function registerAdvertiser(body: {
  companyName: string;
  contactEmail: string;
  billingEmail?: string;
}) {
  return apiRequest<unknown>('/advertisers/register', { method: 'POST', body });
}

export function fetchMyAdvertiserAccounts() {
  return apiRequest<unknown[]>('/advertisers/me');
}

export function fetchAdvertiserAccount(id: string) {
  return apiRequest<Record<string, unknown>>(`/advertisers/me/${id}`);
}
