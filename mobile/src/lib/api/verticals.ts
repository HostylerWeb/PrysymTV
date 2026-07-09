import { apiRequest } from './client';

export function fetchVerticals() {
  return apiRequest<{ items: unknown[] }>('/verticals', { auth: false });
}

export function fetchVerticalSeries(slug: string) {
  return apiRequest<Record<string, unknown>>(`/verticals/${slug}`, { auth: false });
}

export function fetchVerticalEpisode(slug: string, episodeNumber: number) {
  return apiRequest<Record<string, unknown>>(
    `/verticals/${slug}/episodes/${episodeNumber}`,
  );
}

export function postVerticalEpisodeView(episodeId: string) {
  return apiRequest<unknown>(`/verticals/episodes/${episodeId}/view`, {
    method: 'POST',
    auth: false,
  });
}

export function fetchMyVerticalSeries() {
  return apiRequest<{ items: unknown[] }>('/verticals/me/series');
}
