import { apiRequest } from './client';

export type CreatorDashboardResponse = {
  partnerTier: string;
  programVerticals: string[];
  performance: {
    views24h: number;
    views7d: number;
    views30d: number;
    watchHours30d: number;
    subscribers: number;
    engagement30d: number;
    retentionRate: number | null;
  };
  advertising: {
    adImpressionsOnYourContent24h: number;
    adImpressionsOnYourContent7d: number;
    adImpressionsOnYourContent30d: number;
    adClicksOnYourContent30d: number;
    ctr30d: number;
  };
  financial: {
    earnings30dUsd: string;
    adRevenueUsd: string;
    sponsorshipRevenueUsd: string;
    merchandiseRevenueUsd: string;
    donationsUsd: string;
    giftsEarnings30dUsd: string;
    giftsEarningsLifetimeUsd: string;
    pendingPayoutUsd: string;
    availableBalanceUsd: string;
    lifetimeCreditsUsd: string;
  };
  gifts: {
    creatorSharePercent: number;
    coinsReceived30d: number;
    coinsReceivedLifetime: number;
    giftCount30d: number;
    giftCountLifetime: number;
    grossValue30dUsd: string;
    grossValueLifetimeUsd: string;
    earnings30dUsd: string;
    earningsLifetimeUsd: string;
    recent: Array<{
      id: string;
      giftName: string;
      fromUsername: string;
      fromDisplayName: string | null;
      coins: number;
      grossUsd: string;
      creatorEarningsUsd: string;
      createdAt: string;
    }>;
  };
  communityImpact: {
    jobsSupported: number;
    businessesFunded: number;
    dollarsInvested: string;
    workforceOpportunities: number;
  };
  topContent: Array<{
    id: string;
    title: string;
    type: string;
    vertical: string | null;
    viewsCount: number;
    likesCount: number;
    dislikesCount?: number;
    adImpressions30d: number;
    thumbnailUrl: string | null;
  }>;
  content: Array<{
    id: string;
    title: string;
    type: string;
    vertical: string | null;
    viewsCount: number;
    likesCount: number;
    dislikesCount?: number;
    commentsCount: number;
    adImpressions30d: number;
    thumbnailUrl: string | null;
    createdAt: string;
  }>;
};

export function fetchCreatorDashboard() {
  return apiRequest<CreatorDashboardResponse>('/analytics/creators/me/dashboard');
}

export function trackAnalyticsEvents(events: unknown[]) {
  return apiRequest<unknown>('/analytics/track', {
    method: 'POST',
    body: { events },
    auth: false,
  });
}
