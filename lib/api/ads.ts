import { apiRequest, loadStoredAccessToken } from "@/lib/api-client";
import { getAd, type MockAd } from "@/lib/mock-data";

export type AdPlacement =
  | "home_banner"
  | "shorts_interstitial"
  | "movie_preroll"
  | "vertical_episode";

export type ServedAd = {
  id: string;
  title: string;
  mediaUrl: string;
  clickThroughUrl: string;
  placement: AdPlacement;
  mediaType: "image" | "video";
  skipAfterSeconds: number;
};

export type AdAttribution = {
  campaignId: string;
  creatorId?: string;
  videoId?: string;
  placement: AdPlacement;
  viewerUserId?: string;
};

function mockToServed(ad: MockAd): ServedAd {
  return {
    id: ad.id,
    title: ad.title,
    mediaUrl: ad.mediaUrl,
    clickThroughUrl: ad.clickThroughUrl,
    placement: ad.placement,
    mediaType: ad.mediaType,
    skipAfterSeconds: ad.skipAfterSeconds ?? 0,
  };
}

/**
 * Fetches an ad for the placement. Sends Bearer when logged in so premium users get ad-free from API.
 * Pass `skipFetch: true` when the client already knows the user is premium.
 */
export async function fetchServedAd(
  placement: AdPlacement,
  options?: { skipFetch?: boolean },
): Promise<ServedAd | null> {
  if (options?.skipFetch) return null;

  const hasToken = !!loadStoredAccessToken();
  try {
    const res = await apiRequest<{ ad: ServedAd | null; adFree?: boolean }>(
      `/ads/serve?placement=${encodeURIComponent(placement)}`,
      { auth: hasToken },
    );
    if (res.adFree || !res.ad) return null;
    return res.ad;
  } catch {
    /* API offline — fallback only for non-premium guests */
  }
  if (hasToken) return null;
  const mock = getAd(placement);
  return mock ? mockToServed(mock) : null;
}

export async function trackAdImpression(attr: AdAttribution) {
  if (!attr.creatorId) return;
  try {
    await apiRequest("/ads/track/impression", {
      method: "POST",
      body: {
        campaignId: attr.campaignId,
        creatorId: attr.creatorId,
        videoId: attr.videoId,
        placement: attr.placement,
        viewerUserId: attr.viewerUserId,
      },
      auth: false,
    });
  } catch {
    /* non-blocking */
  }
}

export async function trackAdClick(attr: AdAttribution) {
  if (!attr.creatorId) return;
  try {
    await apiRequest("/ads/track/click", {
      method: "POST",
      body: {
        campaignId: attr.campaignId,
        creatorId: attr.creatorId,
        videoId: attr.videoId,
        placement: attr.placement,
        viewerUserId: attr.viewerUserId,
      },
      auth: false,
    });
  } catch {
    /* non-blocking */
  }
}
