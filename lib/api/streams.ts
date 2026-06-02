import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import { getLiveStream } from "@/lib/mock-data";

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

function mockStream(idOrSlug: string): StreamDetail {
  const s = getLiveStream(idOrSlug);
  return {
    id: s.id,
    slug: s.streamerSlug,
    title: s.title,
    thumbnail: s.thumbnail,
    streamer: s.streamer,
    streamerSlug: s.streamerSlug,
    streamerAvatar: s.streamerAvatar,
    viewers: s.viewers,
    viewerCount: s.viewerCount,
    category: s.category,
    status: "live",
    startedAgo: s.startedAgo,
    description: s.description,
    creatorId: "",
  };
}

export function fetchStream(idOrSlug: string) {
  return withApiFallback(
    () => apiRequest<StreamDetail>(`/streams/${encodeURIComponent(idOrSlug)}`, { auth: false }),
    mockStream(idOrSlug),
  );
}

export function fetchLiveStreams() {
  return withApiFallback(
    () => apiRequest<{ items: StreamDetail[] }>("/streams/live", { auth: false }),
    { items: [mockStream("progamerx")] },
  );
}
