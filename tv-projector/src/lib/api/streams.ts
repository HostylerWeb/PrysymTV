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
  accessType?: 'free' | 'paid';
  entryPriceUsd?: number | null;
  entryCoinCost?: number | null;
  isPaid?: boolean;
  hasAccess?: boolean;
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

export function initStream(body: {
  title: string;
  category?: string;
  accessType?: 'free' | 'paid';
  entryPriceUsd?: number;
}) {
  return apiRequest<{
    streamId: string;
    streamKey: string;
    rtmpUrl: string;
    status: string;
    accessType?: string;
    entryPriceUsd?: number | null;
    entryCoinCost?: number | null;
  }>('/streams/init', { method: 'POST', body });
}

export function unlockStream(streamId: string) {
  return apiRequest<{
    success: boolean;
    alreadyOwned?: boolean;
    coinsSpent: number;
    coinsRemaining: number;
    hasAccess: boolean;
  }>(`/streams/${streamId}/unlock`, { method: 'POST' });
}

export function endStream(id: string) {
  return apiRequest<unknown>(`/streams/${id}/end`, { method: 'POST' });
}

export type StreamIngestHealth = {
  rtmpUrl: string;
  hlsPublicUrl: string;
  rtmpReachable: boolean;
  mediamtxRequired: boolean;
  hint: string;
};

export function fetchStreamIngestHealth() {
  return apiRequest<StreamIngestHealth>('/streams/ingest/health', { auth: false });
}
