import { apiRequest } from "@/lib/api-client";

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
    pendingPayoutUsd: string;
    availableBalanceUsd: string;
    lifetimeCreditsUsd: string;
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
    commentsCount: number;
    adImpressions30d: number;
    thumbnailUrl: string | null;
    createdAt: string;
  }>;
};

export function fetchCreatorDashboard() {
  return apiRequest<CreatorDashboardResponse>("/analytics/creators/me/dashboard");
}

export type AnalyticsEventType = "view" | "share" | "watch_time" | "ad_impression" | "ad_click";

export function trackAnalyticsEvents(
  events: Array<{
    eventType: AnalyticsEventType;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }>,
) {
  return apiRequest<{ success: boolean; recorded: number }>("/analytics/track", {
    method: "POST",
    auth: true,
    body: { events },
  });
}

export function trackShare(targetId: string, metadata?: Record<string, unknown>) {
  return trackAnalyticsEvents([
    { eventType: "share", targetId, metadata },
  ]).catch(() => {});
}
