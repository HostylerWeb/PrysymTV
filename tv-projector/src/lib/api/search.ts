import { apiRequest } from './client';
import type { PaginatedMeta } from '@/types/api';

export type SearchVideoHit = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  type: string;
  viewsCount: number;
};

export type SearchCreatorHit = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
};

export type SearchPodcastHit = {
  id: string;
  title: string;
  coverUrl: string | null;
  category: string | null;
};

export type SearchStreamHit = {
  id: string;
  title: string;
  category: string | null;
  creator: { username: string; displayName: string | null };
};

export type SearchVerticalHit = {
  id: string;
  slug: string;
  title: string;
  posterUrl: string | null;
  tagline: string | null;
  totalEpisodes: number;
};

export type SearchResponse = {
  query: string;
  videos: SearchVideoHit[];
  creators: SearchCreatorHit[];
  podcasts: SearchPodcastHit[];
  streams: SearchStreamHit[];
  verticals: SearchVerticalHit[];
};

export type SearchSuggestion = {
  type: string;
  label: string;
  href: string;
};

export function fetchSearch(q: string, type?: string, page = 1) {
  const params = new URLSearchParams({ q, page: String(page) });
  if (type) params.set('type', type);
  return apiRequest<SearchResponse>(`/search?${params}`, { auth: false });
}

export function fetchSearchSuggest(q: string, type?: string) {
  const params = new URLSearchParams({ q });
  if (type) params.set('type', type);
  return apiRequest<{ query: string; suggestions: SearchSuggestion[] }>(
    `/search/suggest?${params}`,
    { auth: false },
  );
}
