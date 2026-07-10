import { apiRequest } from './client';

export type StreamStudioInfo = {
  streamKey: string;
  rtmpUrl: string;
  whipPublishUrl: string;
};

export type StreamDetail = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  streamer: string;
  streamerSlug: string;
  streamerAvatar: string | null;
  viewers: string;
  viewerCount: number;
  category: string;
  status: string;
  startedAgo: string;
  description?: string | null;
  hlsPlaybackUrl?: string | null;
  webrtcPlaybackUrl?: string | null;
  creatorId: string;
  studio?: StreamStudioInfo;
};

export function fetchLiveStreams() {
  return apiRequest<{ items: StreamDetail[] }>('/streams/live', { auth: false });
}

export function fetchStream(idOrUsername: string) {
  return apiRequest<StreamDetail>(`/streams/${idOrUsername}`);
}

export function initStream(body: { title: string; category?: string }) {
  return apiRequest<{
    streamId: string;
    streamKey: string;
    rtmpUrl: string;
    status: string;
  }>('/streams/init', { method: 'POST', body });
}

export function endStream(id: string) {
  return apiRequest<unknown>(`/streams/${id}/end`, { method: 'POST' });
}

export function fetchStreamIngestHealth() {
  return apiRequest<Record<string, unknown>>('/streams/ingest/health');
}
