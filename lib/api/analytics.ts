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
    retentionRate: string | null;
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
  content: Array<
    CreatorDashboardResponse["topContent"][number] & {
      commentsCount: number;
      createdAt: string;
    }
  >;
};

export async function fetchCreatorDashboard() {
  return apiRequest<CreatorDashboardResponse>("/analytics/creators/me/dashboard");
}

export async function trackContentAdImpression(body: {
  campaignId: string;
  creatorId: string;
  videoId?: string;
  placement: "home_banner" | "shorts_interstitial" | "movie_preroll";
  viewerUserId?: string;
}) {
  return apiRequest<{ success: boolean }>("/ads/track/impression", {
    method: "POST",
    body,
    auth: false,
  });
}
