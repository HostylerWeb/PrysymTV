import { apiRequest } from "@/lib/api-client";

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

export type SearchResponse = {
  query: string;
  videos: SearchVideoHit[];
  creators: SearchCreatorHit[];
  podcasts: SearchPodcastHit[];
  streams: SearchStreamHit[];
};

export type SearchSuggestion = {
  type: string;
  label: string;
  href: string;
};

export function searchApi(q: string, type?: string, page = 1) {
  const params = new URLSearchParams({ q, page: String(page) });
  if (type) params.set("type", type);
  return apiRequest<SearchResponse>(`/search?${params}`, { auth: false });
}

export function searchSuggest(q: string) {
  return apiRequest<{ query: string; suggestions: SearchSuggestion[] }>(
    `/search/suggest?q=${encodeURIComponent(q)}`,
    { auth: false },
  );
}

export function hrefForSearchVideo(v: SearchVideoHit): string {
  if (v.type === "short") return `/shorts`;
  if (v.type === "movie") return `/movie/${v.id}`;
  return `/watch/${v.id}`;
}
