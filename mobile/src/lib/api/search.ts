import { apiRequest } from './client';
import type { PaginatedMeta } from '@/types/api';

export function fetchSearch(q: string, type?: string, page = 1) {
  const params = new URLSearchParams({ q, page: String(page) });
  if (type) params.set('type', type);
  return apiRequest<{ items: unknown[]; meta: PaginatedMeta }>(`/search?${params}`, {
    auth: false,
  });
}

export function fetchSearchSuggest(q: string) {
  return apiRequest<{ suggestions: unknown[] }>(`/search/suggest?q=${encodeURIComponent(q)}`, {
    auth: false,
  });
}
