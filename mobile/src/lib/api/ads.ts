import { apiRequest } from './client';

export type AdPlacement =
  | 'home_banner'
  | 'shorts_interstitial'
  | 'movie_preroll'
  | 'vertical_episode';

export function serveAd(placement: AdPlacement, peek = false) {
  const params = new URLSearchParams({ placement });
  if (peek) params.set('peek', '1');
  return apiRequest<{ ad: Record<string, unknown> | null; adFree?: boolean }>(
    `/ads/serve?${params}`,
  );
}

export function trackAdImpression(body: Record<string, unknown>) {
  return apiRequest<unknown>('/ads/track/impression', { method: 'POST', body, auth: false });
}

export function trackAdClick(body: Record<string, unknown>) {
  return apiRequest<unknown>('/ads/track/click', { method: 'POST', body, auth: false });
}
