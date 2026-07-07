import { apiRequest } from "@/lib/api-client";

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

export function registerAdvertiserAccount(body: {
  companyName: string;
  contactEmail: string;
  billingEmail?: string;
}) {
  return apiRequest<AdvertiserAccount>("/advertisers/register", {
    method: "POST",
    body,
  });
}

export function fetchMyAdvertiserAccounts() {
  return apiRequest<AdvertiserAccount[]>("/advertisers/me");
}

export function fetchMyAdvertiserAccount(id: string) {
  return apiRequest<AdvertiserAccountDetail>(`/advertisers/me/${id}`);
}

export function fetchAdvertiserCampaignAnalytics(
  accountId: string,
  campaignId: string,
) {
  return apiRequest<AdvertiserCampaignAnalytics>(
    `/advertisers/me/${accountId}/campaigns/${campaignId}/analytics`,
  );
}

export function cancelAdvertiserRegistration(id: string) {
  return apiRequest<{ ok: true }>(`/advertisers/me/${id}`, {
    method: "DELETE",
  });
}
