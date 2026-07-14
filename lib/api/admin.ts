import { apiRequest, getApiBaseUrl, loadStoredAccessToken } from "@/lib/api-client";

export type AdminDateRangeParams = {
  range?: "7d" | "30d" | "90d";
  dateFrom?: string;
  dateTo?: string;
};

export type AdminListDateParams = {
  dateFrom?: string;
  dateTo?: string;
};

export type AdminOverview = {
  dau: number;
  liveNow: number;
  liveViewers: number;
  revenueTodayUsd: number;
  pendingReports: number;
  pendingPayouts: number;
  pendingPayoutsUsd: number;
  pendingStreamerApplications: number;
  pendingVerticalCreatorApplications: number;
  pendingApplications: number;
  processingVideos?: number;
  processingVerticalEpisodes?: number;
  processingPodcastEpisodes?: number;
  processingTotal?: number;
};

export type AdminProcessingItem = {
  id: string;
  title: string;
  kind: string;
  label: string;
  creator?: string;
  seriesTitle?: string;
  episodeNumber?: number;
  submittedAt: string;
  stage?: "transcoding" | "awaiting_upload";
  adminHref: string;
};

export type AdminApplicationType = "streamer" | "vertical" | "store";

export type AdminApplicationListItem = {
  id: string;
  type: AdminApplicationType;
  userId: string;
  username: string;
  displayName: string | null;
  description: string;
  status: string;
  submittedAt: string;
  hasIdDocument: boolean;
  portfolioUrl: string | null;
  acceptedTerms?: boolean;
};

export type PaginatedMeta = { page: number; limit: number; total: number };

export type AdminReportListItem = {
  id: string;
  status: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  reason: string;
  reporter: string;
  createdAt: string;
};

export type AdminReportDetail = AdminReportListItem & {
  description: string | null;
  reporter: { id: string; username: string; displayName: string | null };
  reviewedBy: { username: string } | null;
  target: {
    title: string;
    excerpt?: string | null;
    creatorId?: string | null;
    thumbnailUrl?: string | null;
    status?: string;
  };
};

export type AdminUserListItem = {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  role: string;
  isVerified: boolean;
  isBanned: boolean;
  streamerStatus: string;
  partnerTier: string;
  coins: number;
  gender: string | null;
  joinedAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  bio: string | null;
  avatarUrl: string | null;
  premiumTier: string;
  birthDate: string | null;
  socialLinks: Array<{ label: string; url: string }>;
  counts: {
    videos: number;
    followers: number;
    following: number;
    streams: number;
    podcastShows: number;
    verticalSeries: number;
    reportsFiled: number;
  };
  verticalSeries: Array<{
    slug: string;
    title: string;
    status: string;
    episodeCount: number;
    siteHref: string;
  }>;
  content: Array<{
    type: string;
    title: string;
    id: string;
    views: number;
    status: string;
    siteHref: string;
  }>;
  payoutProfile: {
    method: string;
    details: Record<string, string>;
    updatedAt: string;
  } | null;
  financial: {
    balanceUsd: number;
    lifetimeEarningsUsd: number;
    coins: number;
    payouts: Array<{
      id: string;
      amountUsd: number;
      method: string;
      status: string;
      payoutDetails: Record<string, string> | null;
      date: string;
    }>;
    giftsReceived: Array<{ gift: string; from: string; coins: number; date: string }>;
  };
  reports: {
    filed: Array<{ id: string; target: string; reason: string; status: string; date: string }>;
    received: Array<{ id: string; target: string; reason: string; status: string; date: string }>;
  };
  streamerApplication: {
    id: string;
    description: string;
    status: string;
    idDocumentUrl: string | null;
    userId?: string;
  } | null;
  verticalCreatorStatus?: string;
  verticalCreatorApplication: {
    id: string;
    description: string;
    status: string;
    portfolioUrl: string | null;
    userId?: string;
  } | null;
  storeCreatorStatus?: string;
  storeCreatorApplication: {
    id: string;
    description: string;
    status: string;
    acceptedTerms?: boolean;
    userId?: string;
  } | null;
  storeProducts: Array<{
    id: string;
    title: string;
    productType: string;
    priceUsd: number;
    status: string;
    imageUrl: string | null;
    inventory: number | null;
    createdAt: string;
  }>;
};

export type AdminStreamerApplication = {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  description: string;
  status: string;
  submittedAt: string;
  hasIdDocument: boolean;
  idDocumentUrl?: string | null;
};

export type AdminVerticalCreatorApplication = {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  description: string;
  idDocumentUrl?: string | null;
  portfolioUrl: string | null;
  status: string;
  submittedAt: string;
};

export type AdminPayout = {
  id: string;
  creator: string;
  creatorId: string;
  amountUsd: number;
  method: string;
  payoutDetails: Record<string, string> | null;
  status: string;
  taxStatus: string;
  createdAt: string;
};

export type AdminLiveStream = {
  id: string;
  title: string;
  creator: string;
  viewers: number;
  category: string;
  startedAt: string;
};

export type AdminVideoListItem = {
  id: string;
  title: string;
  type: string;
  creatorId: string;
  creator: string;
  views: number;
  likes: number;
  comments: number;
  status: string;
  category: string;
  uploadedAt: string;
  siteHref: string;
};

export type AdminCommentListItem = {
  id: string;
  body: string;
  author: string;
  targetType: string;
  targetTitle: string;
  targetId: string;
  likes: number;
  reports: number;
  status: string;
  createdAt: string;
};

export type RevenueSplitRule = {
  ruleKey: string;
  name: string;
  description: string | null;
  creatorBps: number;
  platformBps: number;
  gafBps: number;
  creatorDevFundBps: number;
};

export type AdCampaign = {
  id: string;
  title: string;
  advertiserName: string;
  placement: string;
  bannerSize?: "strip" | "standard" | "hero" | null;
  budgetUsd: string | number;
  deliveredImpressions: number;
  targetImpressions: number;
  clicks: number;
  status: string;
  startsAt: string;
  endsAt: string;
  mediaUrl?: string;
  clickThroughUrl?: string;
  revenueRuleKey?: string;
  advertiserAccountId?: string | null;
  mediaType?: string;
  skipAfterSeconds?: number;
};

function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function fetchAdminOverview() {
  return apiRequest<AdminOverview>("/admin/analytics/overview");
}

export function fetchAdminProcessingContent(limit = 20) {
  return apiRequest<{ items: AdminProcessingItem[]; total: number }>(
    `/admin/content/processing?limit=${limit}`,
  );
}

export type AdminAnalyticsTimeseries = {
  range: string;
  buckets: string[];
  series: {
    dau: number[];
    signups: number[];
    revenueUsd: number[];
    liveHours: number[];
  };
  revenueBySource: Array<{ sourceType: string; totalUsd: number }>;
  topContent: Array<{
    id: string;
    title: string;
    views: number;
    type: string;
    creator: string;
  }>;
  premiumSubscribers: number;
};

export function fetchAdminAnalyticsTimeseries(params?: AdminDateRangeParams) {
  return apiRequest<AdminAnalyticsTimeseries>(
    `/admin/analytics/timeseries${qs(params ?? { range: "30d" })}`,
  );
}

export type AdminUserImpact = {
  periodMonth: string;
  earningsUsd: number;
  adRevenueUsd: number;
  sponsorshipRevenueUsd: number;
  merchandiseRevenueUsd: number;
  donationsUsd: number;
  watchHours: number;
  retentionRate: number | null;
  subscriberCount: number;
  engagementScore: number | null;
  jobsSupported: number;
  businessesFunded: number;
  dollarsInvested: number;
  workforceOpportunities: number;
};

export function fetchAdminUserImpact(userId: string, periodMonth?: string) {
  return apiRequest<AdminUserImpact>(
    `/admin/users/${userId}/impact${qs({ periodMonth })}`,
  );
}

export function updateAdminUserImpact(
  userId: string,
  body: Partial<AdminUserImpact> & { periodMonth: string },
) {
  return apiRequest<AdminUserImpact>(`/admin/users/${userId}/impact`, {
    method: "PUT",
    body,
  });
}

export function fetchAdminReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
} & AdminListDateParams) {
  return apiRequest<{ items: AdminReportListItem[]; meta: PaginatedMeta }>(
    `/admin/reports${qs(params ?? {})}`,
  );
}

export function fetchAdminReport(id: string) {
  return apiRequest<AdminReportDetail>(`/admin/reports/${id}`);
}

export function reviewAdminReport(
  id: string,
  body: { action: "dismiss" | "delete_content" | "ban_user"; notes?: string },
) {
  return apiRequest<{ success: boolean }>(`/admin/reports/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteAdminReport(id: string) {
  return apiRequest<{ success: boolean }>(`/admin/reports/${id}`, {
    method: "DELETE",
  });
}

export function fetchAdminUsers(params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  type?: string;
} & AdminListDateParams) {
  return apiRequest<{ items: AdminUserListItem[]; meta: PaginatedMeta }>(
    `/admin/users${qs(params ?? {})}`,
  );
}

export function fetchAdminUser(id: string) {
  return apiRequest<AdminUserDetail>(`/admin/users/${id}`);
}

export function banAdminUser(id: string, banned: boolean) {
  return apiRequest(`/admin/users/${id}/ban`, { method: "PUT", body: { banned } });
}

export function deleteAdminUser(id: string) {
  return apiRequest(`/admin/users/${id}`, { method: "DELETE" });
}

export function verifyAdminUser(id: string, verified: boolean) {
  return apiRequest(`/admin/users/${id}/verify`, { method: "PUT", body: { verified } });
}

export function updateAdminPartnerTier(
  id: string,
  partnerTier: "standard" | "rising" | "partner" | "flagship",
) {
  return apiRequest(`/admin/users/${id}/partner-tier`, {
    method: "PUT",
    body: { partnerTier },
  });
}

export function adjustAdminUserCoins(id: string, delta: number) {
  return apiRequest(`/admin/users/${id}/coins`, { method: "PUT", body: { delta } });
}

export function fetchAdminApplications(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: "all" | "streamer" | "vertical" | "store";
}) {
  return apiRequest<{ items: AdminApplicationListItem[]; meta: PaginatedMeta }>(
    `/admin/applications${qs(params ?? {})}`,
  );
}

export function fetchAdminStreamerApplications(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiRequest<{ items: AdminStreamerApplication[]; meta: PaginatedMeta }>(
    `/admin/streamer-applications${qs(params ?? {})}`,
  );
}

export function fetchAdminStreamerApplication(id: string) {
  return apiRequest<
    AdminStreamerApplication & {
      userId: string;
      email?: string;
      reviewNotes?: string | null;
    }
  >(`/admin/streamer-applications/${id}`);
}

export function reviewAdminStreamerApplication(
  id: string,
  body: { action: "approve" | "reject"; notes?: string },
) {
  return apiRequest(`/admin/streamer-applications/${id}`, { method: "PUT", body });
}

export function fetchAdminVerticalCreatorApplications(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiRequest<{ items: AdminVerticalCreatorApplication[]; meta: PaginatedMeta }>(
    `/admin/vertical-creator-applications${qs(params ?? {})}`,
  );
}

export function fetchAdminVerticalCreatorApplication(id: string) {
  return apiRequest<
    AdminVerticalCreatorApplication & {
      email?: string;
      verticalCreatorStatus?: string;
      reviewNotes?: string | null;
      reviewedBy?: string | null;
    }
  >(`/admin/vertical-creator-applications/${id}`);
}

export function reviewAdminVerticalCreatorApplication(
  id: string,
  body: { action: "approve" | "reject"; notes?: string },
) {
  return apiRequest(`/admin/vertical-creator-applications/${id}`, { method: "PUT", body });
}

export type AdminStoreCreatorApplication = {
  id: string;
  type: "store";
  userId: string;
  username: string;
  displayName: string | null;
  email?: string;
  storeCreatorStatus?: string;
  description: string;
  status: string;
  hasIdDocument: boolean;
  acceptedTerms: boolean;
  reviewNotes?: string | null;
  submittedAt: string;
  updatedAt: string;
};

export type AdminStoreProductListItem = {
  id: string;
  title: string;
  productType: string;
  priceUsd: number;
  status: string;
  imageUrl: string | null;
  inventory: number | null;
  createdAt: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName: string | null;
  storeSlug: string;
};

export function fetchAdminStoreCreatorApplication(id: string) {
  return apiRequest<AdminStoreCreatorApplication>(
    `/admin/store-creator-applications/${id}`,
  );
}

export function reviewAdminStoreCreatorApplication(
  id: string,
  body: { action: "approve" | "reject"; notes?: string },
) {
  return apiRequest(`/admin/store-creator-applications/${id}`, { method: "PUT", body });
}

export function fetchAdminStoreProducts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}) {
  return apiRequest<{ items: AdminStoreProductListItem[]; meta: PaginatedMeta }>(
    `/admin/store-products${qs(params ?? {})}`,
  );
}

export function fetchAdminPayouts(params?: {
  page?: number;
  limit?: number;
  status?: string;
} & AdminListDateParams) {
  return apiRequest<{ items: AdminPayout[]; meta: PaginatedMeta }>(
    `/admin/payouts${qs(params ?? {})}`,
  );
}

export function processAdminPayout(
  id: string,
  action: "processing" | "complete" | "reject",
) {
  return apiRequest(`/admin/payouts/${id}`, { method: "PUT", body: { action } });
}

export function fetchAdminLiveStreams() {
  return apiRequest<{ items: AdminLiveStream[] }>("/admin/live-streams");
}

export function fetchAdminStreamHistory(params?: {
  page?: number;
  limit?: number;
} & AdminListDateParams) {
  return apiRequest<{
    items: Array<{
      id: string;
      title: string;
      creator: string;
      duration: string;
      endedAt: string;
      status: string;
    }>;
    meta: PaginatedMeta;
  }>(`/admin/stream-history${qs(params ?? {})}`);
}

export function fetchAdminRevenueLedger(params?: {
  page?: number;
  limit?: number;
} & AdminListDateParams) {
  return apiRequest<{
    items: Array<{
      id: string;
      ruleKey: string;
      sourceType: string;
      grossUsd: number;
      creatorId: string | null;
      createdAt: string;
    }>;
    meta: PaginatedMeta;
  }>(`/admin/revenue/ledger${qs(params ?? {})}`);
}

export function fetchApiHealth() {
  return apiRequest<{
    status: string;
    timestamp: string;
    build: string;
    smtp: string;
    storage: string;
    videoProcessing: string;
  }>("/health", { auth: false });
}

export function killAdminStream(id: string) {
  return apiRequest(`/admin/streams/${id}/kill`, { method: "POST" });
}

export type AdminVideoDetail = {
  id: string;
  type: string;
  title: string;
  description: string;
  tagline: string;
  category: string;
  director: string;
  writers: string;
  releaseYear: number | null;
  ageRating: string;
  status: string;
  posterUrl: string | null;
  cast: Array<{ name: string; role: string }>;
  creatorId: string;
  creator: string;
};

export function fetchAdminVideo(id: string) {
  return apiRequest<AdminVideoDetail>(`/admin/videos/${id}`);
}

export function updateAdminVideo(
  id: string,
  body: {
    title?: string;
    description?: string;
    tagline?: string;
    category?: string;
    director?: string;
    writers?: string;
    releaseYear?: number;
    ageRating?: string;
    cast?: Array<{ name: string; role: string }>;
  },
) {
  return apiRequest<AdminVideoDetail>(`/admin/videos/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteAdminVideo(id: string) {
  return apiRequest(`/admin/videos/${id}`, { method: "DELETE" });
}

export function deleteAdminComment(id: string) {
  return apiRequest(`/admin/comments/${id}`, { method: "DELETE" });
}

export function fetchAdminContentVideos(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  q?: string;
}) {
  return apiRequest<{ items: AdminVideoListItem[]; meta: PaginatedMeta }>(
    `/admin/content/videos${qs(params ?? {})}`,
  );
}

export function fetchAdminContentComments(params?: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  return apiRequest<{ items: AdminCommentListItem[]; meta: PaginatedMeta }>(
    `/admin/content/comments${qs(params ?? {})}`,
  );
}

export function fetchAdminRevenueRules() {
  return apiRequest<RevenueSplitRule[]>("/admin/revenue-split-rules");
}

export function updateAdminRevenueRule(
  ruleKey: string,
  body: Partial<{
    name: string;
    description: string;
    creatorBps: number;
    platformBps: number;
    gafBps: number;
    creatorDevFundBps: number;
  }>,
) {
  return apiRequest(`/admin/revenue-split-rules/${ruleKey}`, { method: "PUT", body });
}

export function fetchAdminAdCampaigns(params?: {
  status?: string;
  placement?: string;
  q?: string;
} & AdminListDateParams) {
  return apiRequest<{ items: AdCampaign[]; meta: PaginatedMeta }>(
    `/admin/ads/campaigns${qs(params ?? {})}`,
  ).then((res) => res.items ?? []);
}

export function createAdminAdCampaign(body: {
  advertiserName: string;
  title: string;
  mediaUrl: string;
  clickThroughUrl: string;
  placement: string;
  bannerSize?: "strip" | "standard" | "hero";
  targetImpressions: number;
  budgetUsd: number;
  startsAt: string;
  endsAt: string;
  status?: "draft" | "active";
  revenueRuleKey?: string;
  advertiserAccountId?: string;
}) {
  return apiRequest("/admin/ads/campaigns", { method: "POST", body });
}

export function updateAdminAdCampaign(
  id: string,
  body: Partial<{
    advertiserName: string;
    title: string;
    mediaUrl: string;
    clickThroughUrl: string;
    placement: string;
    bannerSize?: "strip" | "standard" | "hero" | null;
    targetImpressions: number;
    budgetUsd: number;
    startsAt: string;
    endsAt: string;
    revenueRuleKey: string;
    advertiserAccountId: string | null;
  }>,
) {
  return apiRequest<AdCampaign>(`/admin/ads/campaigns/${id}`, { method: "PUT", body });
}

export function duplicateAdminAdCampaign(id: string) {
  return apiRequest<AdCampaign>(`/admin/ads/campaigns/${id}/duplicate`, {
    method: "POST",
  });
}

export function initAdminAdMediaUpload(body: {
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
}) {
  return apiRequest<{
    uploadUrl: string;
    publicUrl: string;
    objectKey: string;
  }>("/admin/ads/media/upload", { method: "POST", body });
}

export function fetchAdminAdCampaign(id: string) {
  return apiRequest<AdCampaign>(`/admin/ads/campaigns/${id}`);
}

export type AdCampaignAnalytics = {
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
  byAudience: {
    impressions: { guest: number; loggedIn: number; total: number };
    clicks: { guest: number; loggedIn: number; total: number };
  };
  byPlacement: Array<{
    placement: string;
    impressions: number;
    clicks: number;
    ctrPercent: number;
  }>;
  timeline: Array<{ date: string; impressions: number; clicks: number }>;
  byLocation: Array<{
    label: string;
    city: string | null;
    regionName: string | null;
    countryCode: string | null;
    clicks: number;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: "ad_impression" | "ad_click";
    placement: string;
    audience: "guest" | "logged_in";
    viewerUserId: string | null;
    videoId: string | null;
    videoTitle: string | null;
    creatorName: string;
    location: string | null;
    city: string | null;
    regionName: string | null;
    countryCode: string | null;
    createdAt: string;
  }>;
};

export function fetchAdminAdCampaignAnalytics(id: string) {
  return apiRequest<AdCampaignAnalytics>(`/admin/ads/campaigns/${id}/analytics`);
}

export function fetchAdminContentStats() {
  return apiRequest<{
    videos: number;
    shorts: number;
    movies: number;
    verticalSeries: number;
    verticalEpisodes: number;
    podcastShows: number;
    podcastEpisodes: number;
    comments: number;
    totalViews: number;
  }>("/admin/content/stats");
}

export type AdminVerticalSeries = {
  slug: string;
  title: string;
  creatorId: string | null;
  creator: string;
  episodeCount: number;
  totalViews: number;
  status: string;
  vertical: string;
};

export function fetchAdminVerticalSeries(params?: { page?: number; limit?: number; q?: string }) {
  return apiRequest<{ items: AdminVerticalSeries[]; meta: PaginatedMeta }>(
    `/admin/content/vertical-series${qs(params ?? {})}`,
  );
}

export function fetchAdminVerticalEpisodes(
  slug: string,
  params?: { page?: number; limit?: number },
) {
  return apiRequest<{
    series: { slug: string; title: string; creator: string; episodeCount: number };
    items: Array<{
      id: string;
      title: string;
      episodeNumber: number;
      views: number;
      likes: number;
      comments: number;
      status: string;
      uploadedAt: string;
      siteHref: string;
    }>;
    meta: PaginatedMeta;
  }>(`/admin/content/vertical-series/${slug}/episodes${qs(params ?? {})}`);
}

export function fetchAdminPodcastShows(params?: { page?: number; limit?: number; q?: string }) {
  return apiRequest<{
    items: Array<{
      id: string;
      title: string;
      creatorId: string;
      creator: string;
      episodeCount: number;
      subscribers: number;
      status: string;
    }>;
    meta: PaginatedMeta;
  }>(`/admin/content/podcast-shows${qs(params ?? {})}`);
}

export function fetchAdminPodcastEpisodes(
  showId: string,
  params?: { page?: number; limit?: number },
) {
  return apiRequest<{
    show: { id: string; title: string; creator: string; episodeCount: number };
    items: Array<{
      id: string;
      title: string;
      durationMin: number;
      plays: number;
      likes: number;
      comments: number;
      status: string;
      publishedAt: string;
      siteHref: string;
    }>;
    meta: PaginatedMeta;
  }>(`/admin/content/podcast-shows/${showId}/episodes${qs(params ?? {})}`);
}

export type AdminVerticalSeriesDetail = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  genre: string;
  status: string;
  creator: string;
  siteHref: string;
};

export type AdminVerticalEpisodeDetail = {
  id: string;
  seriesSlug: string;
  seriesTitle: string;
  episodeNumber: number;
  title: string;
  description: string;
  cliffhanger: string;
  status: string;
  siteHref: string;
};

export type AdminPodcastEpisodeDetail = {
  id: string;
  showId: string;
  showTitle: string;
  title: string;
  description: string;
  status: string;
  siteHref: string;
};

export function fetchAdminVerticalSeriesDetail(slug: string) {
  return apiRequest<AdminVerticalSeriesDetail>(`/admin/vertical-series/${slug}`);
}

export function updateAdminVerticalSeries(
  slug: string,
  body: {
    title?: string;
    tagline?: string;
    description?: string;
    genre?: string;
  },
) {
  return apiRequest<AdminVerticalSeriesDetail>(`/admin/vertical-series/${slug}`, {
    method: "PUT",
    body,
  });
}

export function fetchAdminVerticalEpisode(id: string) {
  return apiRequest<AdminVerticalEpisodeDetail>(`/admin/vertical-episodes/${id}`);
}

export function updateAdminVerticalEpisode(
  id: string,
  body: {
    episodeNumber?: number;
    title?: string;
    description?: string;
    cliffhanger?: string;
  },
) {
  return apiRequest<AdminVerticalEpisodeDetail>(`/admin/vertical-episodes/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteAdminVerticalEpisode(id: string) {
  return apiRequest(`/admin/vertical-episodes/${id}`, { method: "DELETE" });
}

export function fetchAdminPodcastEpisode(id: string) {
  return apiRequest<AdminPodcastEpisodeDetail>(`/admin/podcast-episodes/${id}`);
}

export function updateAdminPodcastEpisode(
  id: string,
  body: { title?: string; description?: string },
) {
  return apiRequest<AdminPodcastEpisodeDetail>(`/admin/podcast-episodes/${id}`, {
    method: "PUT",
    body,
  });
}

export function deleteAdminPodcastEpisode(id: string) {
  return apiRequest(`/admin/podcast-episodes/${id}`, { method: "DELETE" });
}

export function deleteAdminPodcastShow(id: string) {
  return apiRequest(`/admin/podcast-shows/${id}`, { method: "DELETE" });
}

export function deleteAdminVerticalSeries(slug: string) {
  return apiRequest(`/admin/vertical-series/${slug}`, { method: "DELETE" });
}

export function deleteAdminStream(id: string) {
  return apiRequest(`/admin/streams/${id}`, { method: "DELETE" });
}

export function deleteAdminAdCampaign(id: string) {
  return apiRequest(`/admin/ads/campaigns/${id}`, { method: "DELETE" });
}

export function deleteAdminAdvertiser(id: string) {
  return apiRequest(`/admin/advertisers/${id}`, { method: "DELETE" });
}

export type AdminEconomyConfig = {
  coinUsd: number;
  minPaidStreamUsd: number;
  minPayoutUsd: number;
  membershipPriceUsd: number;
  insiderPriceUsd: number;
  premiumBasicPriceUsd: number;
  premiumPriceUsd: number;
  ultimatePriceUsd: number;
  coinPackages: Array<{
    id: string;
    label: string;
    coins: number;
    priceUsd: number;
    isActive: boolean;
    sortOrder: number;
  }>;
  gifts: Array<{
    id: string;
    name: string;
    coinCost: number;
    animationKey: string;
    imageUrl: string | null;
    isActive: boolean;
  }>;
};

export type AdminAdsConfig = {
  shortsInterstitialEveryNSwipes: number;
  moviePrerollSkipSeconds: number;
  shortsSkipSeconds: number;
  gafRuleKey: string;
  impressionRevenueCpmUsd: number;
  placements: {
    home_banner: boolean;
    shorts_interstitial: boolean;
    movie_preroll: boolean;
    vertical_episode: boolean;
  };
};

export type AdminAnalyticsConfig = {
  defaultRange: "today" | "7d" | "30d";
  kpiVisibility: {
    dau: boolean;
    liveNow: boolean;
    revenueToday: boolean;
    pendingReports: boolean;
    pendingPayouts: boolean;
  };
  alertPendingReportsThreshold: number;
};

export type AdminScorecardConfig = {
  scorecardDisplay: {
    showZeroRevenueLines: "hide" | "dash" | "zero";
    defaultImpactPeriod: string;
  };
  moduleScorecard: Array<{
    module: number;
    name: string;
    percent: number;
    notes: string;
  }>;
};

export function fetchAdminEconomyConfig() {
  return apiRequest<AdminEconomyConfig>("/admin/config/economy");
}

export function updateAdminEconomyConfig(body: Partial<AdminEconomyConfig>) {
  return apiRequest("/admin/config/economy", { method: "PUT", body });
}

export function fetchAdminAdsConfig() {
  return apiRequest<AdminAdsConfig>("/admin/config/ads");
}

export function updateAdminAdsConfig(body: Partial<AdminAdsConfig>) {
  return apiRequest<AdminAdsConfig>("/admin/config/ads", { method: "PUT", body });
}

export function fetchAdminAnalyticsConfig() {
  return apiRequest<AdminAnalyticsConfig>("/admin/config/analytics");
}

export function updateAdminAnalyticsConfig(body: Partial<AdminAnalyticsConfig>) {
  return apiRequest<AdminAnalyticsConfig>("/admin/config/analytics", { method: "PUT", body });
}

export function fetchAdminScorecardConfig() {
  return apiRequest<AdminScorecardConfig>("/admin/config/scorecard");
}

export function updateAdminScorecardConfig(body: Partial<AdminScorecardConfig>) {
  return apiRequest<AdminScorecardConfig>("/admin/config/scorecard", { method: "PUT", body });
}

export function updateAdminProgramsConfig(
  programs: Array<{
    slug: string;
    label: string;
    vertical: string;
    description: string;
    href: string;
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  return apiRequest("/admin/config/programs", { method: "PUT", body: { programs } });
}

export function fetchAdminPodcastCategoriesConfig() {
  return apiRequest<
    Array<{
      slug: string;
      label: string;
      isActive: boolean;
      sortOrder: number;
    }>
  >("/admin/config/podcast-categories");
}

export function updateAdminPodcastCategoriesConfig(
  categories: Array<{
    slug: string;
    label: string;
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  return apiRequest("/admin/config/podcast-categories", {
    method: "PUT",
    body: { categories },
  });
}

export function fetchAdminMovieGenresConfig() {
  return apiRequest<
    Array<{
      slug: string;
      label: string;
      isActive: boolean;
      sortOrder: number;
    }>
  >("/admin/config/movie-genres");
}

export function updateAdminMovieGenresConfig(
  genres: Array<{
    slug: string;
    label: string;
    isActive: boolean;
    sortOrder: number;
  }>,
) {
  return apiRequest("/admin/config/movie-genres", {
    method: "PUT",
    body: { genres },
  });
}

export function upsertAdminCoinPackage(body: {
  id: string;
  coins: number;
  priceUsd: number;
  label: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return apiRequest("/admin/coin-packages", { method: "PUT", body });
}

export function deleteAdminCoinPackage(id: string) {
  return apiRequest(`/admin/coin-packages/${id}`, { method: "DELETE" });
}

export function upsertAdminGiftCatalog(body: {
  id: string;
  name: string;
  coinCost: number;
  animationKey?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}) {
  return apiRequest("/admin/gift-catalog", { method: "PUT", body });
}

export function initAdminGiftImageUpload(body: {
  giftId: string;
  fileName: string;
  mimeType: string;
}) {
  return apiRequest<{
    uploadUrl: string;
    uploadMethod: string;
    uploadHeaders: Record<string, string>;
    publicUrl: string;
    objectKey: string;
  }>("/admin/gift-catalog/image/upload", { method: "POST", body });
}

export function deleteAdminGiftCatalog(id: string) {
  return apiRequest(`/admin/gift-catalog/${id}`, { method: "DELETE" });
}

export function fetchAdminProgramsConfig() {
  return apiRequest<
    Array<{
      slug: string;
      label: string;
      vertical: string;
      description: string;
      href: string;
      isActive: boolean;
      sortOrder: number;
    }>
  >("/admin/config/programs");
}

export function fetchAdminGiftActivity(params?: {
  page?: number;
  limit?: number;
  q?: string;
} & AdminListDateParams) {
  return apiRequest<{
    items: Array<{
      id: string;
      giftName: string;
      coinCost: number;
      sender: string;
      recipient: string;
      context: string;
      contextTitle: string;
      createdAt: string;
    }>;
    meta: PaginatedMeta;
  }>(`/admin/economy/gifts${qs(params ?? {})}`);
}

export function fetchAdminTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  q?: string;
} & AdminListDateParams) {
  return apiRequest<{
    items: Array<{
      id: string;
      type: string;
      user: string;
      amountUsd: number;
      coins: number | null;
      status: string;
      createdAt: string;
    }>;
    meta: PaginatedMeta;
  }>(`/admin/economy/transactions${qs(params ?? {})}`);
}

export function updateAdminAdCampaignStatus(
  id: string,
  status: "draft" | "active" | "paused" | "completed",
) {
  return apiRequest(`/admin/ads/campaigns/${id}/status`, {
    method: "PUT",
    body: { status },
  });
}

export type AdminAnalyticsContentResponse = {
  topDisliked: Array<{
    id: string;
    title: string;
    type: string;
    creator: string;
    dislikesCount: number;
    views: number;
  }>;
};

export type AdminAnalyticsGeographyResponse = {
  countries: Array<{
    countryCode: string;
    views: number;
    users: number;
  }>;
};

export function fetchAdminAnalyticsContent(params?: AdminDateRangeParams) {
  return apiRequest<AdminAnalyticsContentResponse>(
    `/admin/analytics/content${qs(params ?? { range: "30d" })}`,
  );
}

export function fetchAdminAnalyticsGeography(params?: AdminDateRangeParams) {
  return apiRequest<AdminAnalyticsGeographyResponse>(
    `/admin/analytics/geography${qs(params ?? { range: "30d" })}`,
  );
}

export async function exportAdminAnalyticsCsv(params?: AdminDateRangeParams) {
  const query = params ?? { range: "30d" as const };
  const token = loadStoredAccessToken();
  const res = await fetch(
    `${getApiBaseUrl()}/admin/analytics/export${qs(query)}`,
    {
      credentials: "include",
      headers: {
        Accept: "text/csv",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prysym-analytics-${query.dateFrom ?? query.range ?? "export"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type AdminAuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: { username: string; displayName: string | null };
};

export function fetchAdminAuditLogs(params?: {
  page?: number;
  limit?: number;
  entityType?: string;
} & AdminListDateParams) {
  return apiRequest<{ items: AdminAuditLogItem[]; meta: PaginatedMeta }>(
    `/admin/audit-logs${qs(params ?? {})}`,
  );
}

export type AdminGafLedgerResponse = {
  items: Array<{
    id: string;
    direction: string;
    source: string;
    amountUsd: string | number;
    programCategory: string | null;
    createdAt: string;
  }>;
  meta: PaginatedMeta;
  summary: {
    totalInflowUsd: number;
    totalOutflowUsd: number;
    balanceUsd: number;
  };
};

export function fetchAdminGafLedger(params?: {
  page?: number;
  limit?: number;
  direction?: "inflow" | "outflow";
} & AdminListDateParams) {
  return apiRequest<AdminGafLedgerResponse>(`/admin/gaf/ledger${qs(params ?? {})}`);
}

export type AdminGafProgram = {
  id: string;
  category: string;
  title: string;
  description: string | null;
};

export function fetchAdminGafPrograms() {
  return apiRequest<AdminGafProgram[]>("/admin/gaf/programs");
}

export function createAdminGafGrant(body: {
  amountUsd: number;
  programCategory: "economic" | "workforce" | "housing" | "youth";
  gafProgramId?: string;
  description?: string;
}) {
  return apiRequest<{ id: string }>("/admin/gaf/grants", {
    method: "POST",
    body,
  });
}

export type AdminAdvertiserAccount = {
  id: string;
  companyName: string;
  contactEmail: string;
  billingEmail: string | null;
  isVerified: boolean;
  createdAt: string;
  owner: { id: string; username: string; displayName: string | null } | null;
  _count: { campaigns: number };
};

export function fetchAdminAdvertisers() {
  return apiRequest<AdminAdvertiserAccount[]>("/admin/advertisers");
}

export function verifyAdminAdvertiser(id: string, isVerified: boolean) {
  return apiRequest<AdminAdvertiserAccount>(`/admin/advertisers/${id}/verify`, {
    method: "POST",
    body: { isVerified },
  });
}
