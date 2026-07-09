import { apiRequest } from './client';
import type { VerticalEpisodePlayback, VerticalSeriesDetail } from '@/types/api';

export function fetchVerticals() {
  return apiRequest<{ items: unknown[] }>('/verticals', { auth: false });
}

export function fetchVerticalSeries(slug: string) {
  return apiRequest<VerticalSeriesDetail>(`/verticals/${slug}`, { auth: false });
}

export function fetchVerticalEpisode(slug: string, episodeNumber: number) {
  return apiRequest<VerticalEpisodePlayback>(
    `/verticals/${slug}/episodes/${episodeNumber}`,
  );
}

export function postVerticalEpisodeView(episodeId: string) {
  return apiRequest<unknown>(`/verticals/episodes/${episodeId}/view`, {
    method: 'POST',
    auth: false,
  });
}

export function toggleVerticalEpisodeLike(episodeId: string) {
  return apiRequest<{ liked: boolean }>(`/verticals/episodes/${episodeId}/like`, {
    method: 'POST',
  });
}

export function toggleVerticalEpisodeDislike(episodeId: string) {
  return apiRequest<{ disliked: boolean }>(`/verticals/episodes/${episodeId}/dislike`, {
    method: 'POST',
  });
}

export function toggleVerticalEpisodeSave(episodeId: string) {
  return apiRequest<{ saved: boolean }>(`/verticals/episodes/${episodeId}/save`, {
    method: 'POST',
  });
}

export function toggleVerticalSeriesSave(seriesId: string) {
  return apiRequest<{ saved: boolean }>(`/verticals/series/${seriesId}/save`, {
    method: 'POST',
  });
}

export function fetchMyVerticalSeries() {
  return apiRequest<{
    items: Array<{
      id: string;
      slug: string;
      title: string;
      totalEpisodes: number;
      episodeCount?: number;
      genre?: string | null;
      posterUrl?: string | null;
    }>;
  }>('/verticals/me/series');
}

export function createVerticalSeries(body: {
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  genre?: string;
  posterUrl?: string;
}) {
  return apiRequest<{ id: string; slug: string }>('/verticals/series', { method: 'POST', body });
}

export function createVerticalEpisode(
  seriesSlug: string,
  body: {
    episodeNumber: number;
    title: string;
    description?: string;
    cliffhanger?: string;
    durationSeconds?: number;
  },
) {
  return apiRequest<{ id: string }>(`/verticals/series/${seriesSlug}/episodes`, {
    method: 'POST',
    body,
  });
}

export function attachVerticalEpisodeVideo(episodeId: string, videoId: string) {
  return apiRequest<unknown>(`/verticals/episodes/${episodeId}/video`, {
    method: 'PUT',
    body: { videoId },
  });
}
