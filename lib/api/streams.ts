import { apiRequest } from "@/lib/api-client";

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
  creatorId: string;
};

export type StreamInitResponse = {
  streamId: string;
  streamKey: string;
  rtmpUrl: string;
  status: string;
};

export function fetchStream(idOrSlug: string) {
  return apiRequest<StreamDetail>(`/streams/${encodeURIComponent(idOrSlug)}`, {
    auth: false,
  });
}

export function fetchLiveStreams() {
  return apiRequest<{ items: StreamDetail[] }>("/streams/live", { auth: false });
}

export function initStream(title: string, category?: string) {
  return apiRequest<StreamInitResponse>("/streams/init", {
    method: "POST",
    body: { title, ...(category ? { category } : {}) },
  });
}

export function getRtmpIngestUrl(): string {
  return (
    process.env.NEXT_PUBLIC_RTMP_INGEST_URL?.trim() ||
    "rtmp://localhost:1935/live"
  );
}
