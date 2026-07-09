import { apiRequest } from './client';

export type AdvertiserAccount = {
  id: string;
  companyName: string;
  contactEmail: string;
  billingEmail: string | null;
  isVerified: boolean;
  createdAt: string;
  _count?: { campaigns: number };
};

export type AdvertiserCampaign = {
  id: string;
  title: string;
  placement: string;
  status: string;
  targetImpressions: number;
  deliveredImpressions: number;
  clicks: number;
  budgetUsd: string | number;
  spentUsd?: string | number;
  startsAt: string;
  endsAt: string;
};

export type AdvertiserAccountDetail = AdvertiserAccount & {
  campaigns: AdvertiserCampaign[];
};

export function registerAdvertiser(body: {
  companyName: string;
  contactEmail: string;
  billingEmail?: string;
}) {
  return apiRequest<AdvertiserAccount>('/advertisers/register', { method: 'POST', body });
}

export function fetchMyAdvertiserAccounts() {
  return apiRequest<AdvertiserAccount[]>('/advertisers/me');
}

export function fetchAdvertiserAccount(id: string) {
  return apiRequest<AdvertiserAccountDetail>(`/advertisers/me/${id}`);
}

export function cancelAdvertiserRegistration(id: string) {
  return apiRequest<{ ok: true }>(`/advertisers/me/${id}`, { method: 'DELETE' });
}
