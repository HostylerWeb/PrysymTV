import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import type { ContinueWatchingFeedItem, PaginatedMeta } from "@/lib/api/types";

export type FeedHomeResponse = {
  liveNow: Array<{
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    hlsPlaybackUrl: string | null;
    streamer: string;
    streamerSlug: string;
    streamerAvatar: string | null;
    viewers: number;
    category: string | null;
  }>;
  continueWatching: ContinueWatchingFeedItem[];
  featuredLive: {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    hlsPlaybackUrl: string | null;
    streamer: string;
    streamerAvatar: string | null;
    viewerCount: number;
  } | null;
  trending: VideoCard[];
  newReleases: VideoCard[];
  movies: VideoCard[];
  featuredMovie: VideoCard | null;
  heroMovieReason: "new_release" | "trending" | null;
};

export type VideoCard = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  posterUrl?: string | null;
  durationSeconds: number;
  viewsCount: number;
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
  saved?: boolean;
  disliked?: boolean;
  type: string;
  category: string | null;
  vertical?: string | null;
  channel: string;
  channelSlug: string;
  creatorId: string;
  playbackUrl?: string | null;
  videoUrl?: string | null;
  releaseYear?: number | null;
  tagline?: string | null;
};

const EMPTY_FEED_HOME: FeedHomeResponse = {
  liveNow: [],
  continueWatching: [],
  featuredLive: null,
  trending: [],
  newReleases: [],
  movies: [],
  featuredMovie: null,
  heroMovieReason: null,
};

export function fetchFeedHome() {
  return withApiFallback(
    () => apiRequest<FeedHomeResponse>("/feed/home"),
    EMPTY_FEED_HOME,
  );
}

export function fetchFeedTrending(page = 1, limit = 24) {
  return withApiFallback(
    () =>
      apiRequest<{ items: VideoCard[]; meta: PaginatedMeta }>(
        `/feed/trending?page=${page}&limit=${limit}`,
        { auth: false },
      ),
    { items: [], meta: { page: 1, limit, total: 0 } },
  );
}
