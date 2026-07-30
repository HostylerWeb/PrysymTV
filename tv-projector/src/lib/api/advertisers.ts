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

export type AdvertiserCampaignAnalytics = {
  campaign: {
    id: string;
    title: string;
    placement: string;
    status: string;
    targetImpressions: number;
    deliveredImpressions: number;
    clicks: number;
    budgetUsd: number;
    spentUsd: number;
    startsAt: string;
    endsAt: string;
  };
  summary: {
    servedImpressions: number;
    targetImpressions: number;
    deliveryPercent: number;
    clicks: number;
    ctrPercent: number;
    trackedImpressions: number;
    trackedClicks: number;
    budgetUsd: number;
    spentUsd: number;
    budgetRemainingUsd: number;
    cpmUsd: number;
  };
};

export type AdMediaUploadInit = {
  objectKey: string;
  uploadUrl: string;
  uploadMethod: string;
  uploadHeaders: Record<string, string>;
  expiresIn: number;
  publicUrl: string;
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

export function fetchAdvertiserCampaignAnalytics(accountId: string, campaignId: string) {
  return apiRequest<AdvertiserCampaignAnalytics>(
    `/advertisers/me/${accountId}/campaigns/${campaignId}/analytics`,
  );
}

export function createAdvertiserCampaign(
  accountId: string,
  body: {
    title: string;
    mediaUrl: string;
    clickThroughUrl: string;
    placement: string;
    targetImpressions: number;
    budgetUsd: number;
    startsAt: string;
    endsAt: string;
    bannerSize?: 'strip' | 'standard' | 'hero';
  },
) {
  return apiRequest<AdvertiserCampaign>(`/advertisers/me/${accountId}/campaigns`, {
    method: 'POST',
    body,
  });
}

export function updateAdvertiserCampaign(
  accountId: string,
  campaignId: string,
  body: Partial<{
    title: string;
    mediaUrl: string;
    clickThroughUrl: string;
    placement: string;
    targetImpressions: number;
    budgetUsd: number;
    startsAt: string;
    endsAt: string;
    bannerSize: 'strip' | 'standard' | 'hero' | null;
    status: 'draft' | 'active' | 'paused';
  }>,
) {
  return apiRequest<AdvertiserCampaign>(
    `/advertisers/me/${accountId}/campaigns/${campaignId}`,
    { method: 'PUT', body },
  );
}

export function initAdvertiserAdMediaUpload(
  accountId: string,
  body: { mimeType: string; fileName?: string },
) {
  return apiRequest<AdMediaUploadInit>(`/advertisers/me/${accountId}/media/upload`, {
    method: 'POST',
    body,
  });
}

export function cancelAdvertiserRegistration(id: string) {
  return apiRequest<{ ok: true }>(`/advertisers/me/${id}`, { method: 'DELETE' });
}
