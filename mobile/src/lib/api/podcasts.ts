import { apiRequest } from './client';
import type { PaginatedMeta, PodcastEpisodeDetail, VerticalEpisodePlayback, VerticalSeriesDetail } from '@/types/api';

type ApiPodcastShow = {
  id: string;
  title: string;
  coverUrl?: string | null;
  creator?: { username: string; displayName?: string | null };
  _count?: { episodes: number };
  episodes?: Array<{ id: string }>;
};

export function fetchPodcastShows(page = 1, limit = 24) {
  return apiRequest<{ items: ApiPodcastShow[]; meta: PaginatedMeta }>(
    `/podcasts/shows?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

export function fetchFeaturedPodcastShow() {
  return apiRequest<{ show: ApiPodcastShow | null }>('/podcasts/shows/featured', {
    auth: false,
  });
}

export function fetchTrendingPodcastShows(limit = 12) {
  return apiRequest<{ items: ApiPodcastShow[] }>(
    `/podcasts/shows/trending?limit=${limit}`,
    { auth: false },
  );
}

export function fetchPodcastEpisodesFeed(page = 1, limit = 24) {
  return apiRequest<{ items: PodcastEpisodeDetail[]; meta: PaginatedMeta }>(
    `/podcasts/episodes/feed?page=${page}&limit=${limit}`,
  );
}

export function fetchPodcastEpisode(id: string) {
  return apiRequest<PodcastEpisodeDetail>(`/podcasts/episodes/${id}`);
}

export function postPodcastEpisodePlay(id: string) {
  return apiRequest<unknown>(`/podcasts/episodes/${id}/play`, { method: 'POST', auth: false });
}

export function togglePodcastLike(id: string) {
  return apiRequest<{ liked: boolean }>(`/podcasts/episodes/${id}/like`, { method: 'POST' });
}

export function togglePodcastDislike(id: string) {
  return apiRequest<{ disliked: boolean }>(`/podcasts/episodes/${id}/dislike`, { method: 'POST' });
}

export function togglePodcastSave(id: string) {
  return apiRequest<{ saved: boolean }>(`/podcasts/episodes/${id}/save`, { method: 'POST' });
}

export type MyPodcastShow = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  category: string | null;
  _count: { episodes: number };
  episodes?: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    durationSeconds: number;
    publishedAt: string | null;
  }>;
};

export function fetchMyPodcastShows() {
  return apiRequest<{ items: MyPodcastShow[] }>('/podcasts/shows/me');
}

export function createPodcastShow(body: {
  title: string;
  description?: string;
  coverUrl?: string;
  category?: string;
}) {
  return apiRequest<{ id: string }>('/podcasts/shows', { method: 'POST', body });
}

export function createPodcastEpisode(
  showId: string,
  body: { title: string; description?: string; coverUrl?: string },
) {
  return apiRequest<{ id: string }>(`/podcasts/shows/${showId}/episodes`, {
    method: 'POST',
    body,
  });
}

export function deletePodcastEpisode(episodeId: string) {
  return apiRequest<{ success: boolean }>(`/podcasts/episodes/${episodeId}`, {
    method: 'DELETE',
  });
}

export function deletePodcastShow(showId: string) {
  return apiRequest<{ success: boolean }>(`/podcasts/shows/${showId}`, {
    method: 'DELETE',
  });
}
