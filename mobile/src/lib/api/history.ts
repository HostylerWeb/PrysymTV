import { apiRequest } from './client';
import type { HistoryItemRecord, PaginatedMeta } from '@/types/api';

export function fetchHistory(page = 1, limit = 24) {
  return apiRequest<{ items: HistoryItemRecord[]; meta: PaginatedMeta }>(
    `/history?page=${page}&limit=${limit}`,
  );
}

export function postHistoryProgress(body: {
  contentType: 'video' | 'podcast_episode' | 'vertical_episode';
  contentId: string;
  progressSeconds: number;
  completed: boolean;
}) {
  return apiRequest<unknown>('/history/progress', { method: 'POST', body });
}

export function clearHistory() {
  return apiRequest<unknown>('/history/clear', { method: 'DELETE' });
}

export function deleteHistoryItem(
  contentType: 'video' | 'podcast_episode' | 'vertical_episode',
  contentId: string,
) {
  return apiRequest<unknown>(`/history/${contentType}/${contentId}`, { method: 'DELETE' });
}
