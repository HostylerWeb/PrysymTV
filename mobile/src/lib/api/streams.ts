import { apiRequest } from './client';

export function fetchLiveStreams() {
  return apiRequest<unknown[]>('/streams/live', { auth: false });
}

export function fetchStream(idOrUsername: string) {
  return apiRequest<Record<string, unknown>>(`/streams/${idOrUsername}`);
}

export function initStream(body: { title: string; category?: string }) {
  return apiRequest<Record<string, unknown>>('/streams/init', { method: 'POST', body });
}

export function endStream(id: string) {
  return apiRequest<unknown>(`/streams/${id}/end`, { method: 'POST' });
}

export function fetchStreamIngestHealth() {
  return apiRequest<Record<string, unknown>>('/streams/ingest/health');
}
