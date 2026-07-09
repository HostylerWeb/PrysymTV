import { apiRequest, loadStoredAccessToken } from './client';

export type AdPlacement =
  | 'home_banner'
  | 'shorts_interstitial'
  | 'movie_preroll'
  | 'vertical_episode';

export type ServedAd = {
  id: string;
  title: string;
  mediaUrl: string;
  clickThroughUrl: string;
  placement: AdPlacement;
  mediaType: 'image' | 'video';
  skipAfterSeconds: number;
};

export type AdAttribution = {
  campaignId: string;
  creatorId?: string;
  videoId?: string;
  placement: AdPlacement;
  viewerUserId?: string;
};

export function isValidServedAd(ad: ServedAd | null | undefined): ad is ServedAd {
  return Boolean(ad?.mediaUrl?.trim());
}

export function buildAdAttribution(params: {
  campaignId: string;
  placement: AdPlacement;
  creatorId?: string;
  platformCreatorId?: string;
  videoId?: string;
  viewerUserId?: string;
}): AdAttribution {
  return {
    campaignId: params.campaignId,
    placement: params.placement,
    creatorId: params.creatorId ?? params.platformCreatorId,
    videoId: params.videoId,
    viewerUserId: params.viewerUserId,
  };
}

export async function fetchServedAd(
  placement: AdPlacement,
  options?: { skipFetch?: boolean; peek?: boolean },
): Promise<ServedAd | null> {
  if (options?.skipFetch) return null;

  const hasToken = Boolean(await loadStoredAccessToken());
  const params = new URLSearchParams({ placement });
  if (options?.peek) params.set('peek', '1');

  try {
    const res = await apiRequest<{ ad: ServedAd | null; adFree?: boolean }>(
      `/ads/serve?${params}`,
      { auth: hasToken },
    );
    if (res.adFree || !res.ad) return null;
    return res.ad;
  } catch {
    return null;
  }
}

export async function trackAdImpression(attr: AdAttribution) {
  try {
    await apiRequest('/ads/track/impression', {
      method: 'POST',
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
  try {
    await apiRequest('/ads/track/click', {
      method: 'POST',
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

/** @deprecated Use fetchServedAd */
export function serveAd(placement: AdPlacement, peek = false) {
  return fetchServedAd(placement, { peek });
}
