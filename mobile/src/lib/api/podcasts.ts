import { apiRequest } from './client';
import type { PaginatedMeta } from '@/types/api';

export function fetchPodcastShows(page = 1, limit = 24) {
  return apiRequest<{ items: unknown[]; meta: PaginatedMeta }>(
    `/podcasts/shows?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

export function fetchFeaturedPodcastShows() {
  return apiRequest<unknown[]>('/podcasts/shows/featured', { auth: false });
}

export function fetchTrendingPodcastShows(limit = 12) {
  return apiRequest<unknown[]>(`/podcasts/shows/trending?limit=${limit}`, { auth: false });
}

export function fetchPodcastEpisodesFeed(page = 1, limit = 24) {
  return apiRequest<{ items: unknown[]; meta: PaginatedMeta }>(
    `/podcasts/episodes/feed?page=${page}&limit=${limit}`,
  );
}

export function fetchPodcastEpisode(id: string) {
  return apiRequest<Record<string, unknown>>(`/podcasts/episodes/${id}`);
}

export function postPodcastEpisodePlay(id: string) {
  return apiRequest<unknown>(`/podcasts/episodes/${id}/play`, { method: 'POST', auth: false });
}
