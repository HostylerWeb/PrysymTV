import { apiRequest } from "@/lib/api-client";

export function searchApi(q: string, type?: string, page = 1) {
  const params = new URLSearchParams({ q, page: String(page) });
  if (type) params.set("type", type);
  return apiRequest<{
    query: string;
    videos: unknown[];
    creators: unknown[];
    podcasts: unknown[];
    streams: unknown[];
  }>(`/search?${params}`, { auth: false });
}

export function searchSuggest(q: string) {
  return apiRequest<{ query: string; suggestions: Array<{ type: string; label: string; href: string }> }>(
    `/search/suggest?q=${encodeURIComponent(q)}`,
    { auth: false },
  );
}
