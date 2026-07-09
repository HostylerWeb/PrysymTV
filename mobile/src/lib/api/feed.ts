import { apiRequest } from './client';
import type { ContinueWatchingFeedItem, PaginatedMeta, VideoCardDetail } from '@/types/api';

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
  trending: VideoCardDetail[];
  newReleases: VideoCardDetail[];
  movies: VideoCardDetail[];
  featuredMovie: VideoCardDetail | null;
  heroMovieReason: 'new_release' | 'trending' | null;
};

export function fetchFeedHome() {
  return apiRequest<FeedHomeResponse>('/feed/home');
}

export function fetchFeedTrending(page = 1, limit = 24) {
  return apiRequest<{ items: VideoCardDetail[]; meta: PaginatedMeta }>(
    `/feed/trending?page=${page}&limit=${limit}`,
    { auth: false },
  );
}
