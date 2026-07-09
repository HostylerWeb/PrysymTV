import { apiRequest } from './client';
import type { PaginatedMeta, VideoCardDetail } from '@/types/api';

export function fetchShortsFeed(cursor?: string, limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<{ items: VideoCardDetail[]; nextCursor: string | null }>(
    `/videos/feed/shorts?${params}`,
  );
}

export function fetchMoviesFeed(page = 1, limit = 24) {
  return apiRequest<{ items: VideoCardDetail[]; meta: PaginatedMeta }>(
    `/videos/feed/movies?page=${page}&limit=${limit}`,
    { auth: false },
  );
}

export function fetchFeaturedMovie() {
  return apiRequest<VideoCardDetail | null>('/videos/feed/movies/featured', { auth: false });
}

export type VideosBrowseParams = {
  page?: number;
  limit?: number;
  vertical?: string;
  sort?: 'views' | 'newest';
  mode?: 'all' | 'videos' | 'live';
  q?: string;
};

export function fetchVideosBrowse(params: VideosBrowseParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.vertical) search.set('vertical', params.vertical);
  if (params.sort) search.set('sort', params.sort);
  if (params.mode) search.set('mode', params.mode);
  if (params.q) search.set('q', params.q);
  return apiRequest<{
    videos: { items: VideoCardDetail[]; meta: PaginatedMeta };
    live: { items: unknown[] };
  }>(`/videos/feed/videos?${search}`);
}
