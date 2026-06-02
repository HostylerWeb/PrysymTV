import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import {
  mockLiveStreams,
  mockMovies,
  mockVideos,
} from "@/lib/mock-data";

export type FeedHomeResponse = {
  liveNow: Array<{
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    streamer: string;
    streamerSlug: string;
    streamerAvatar: string | null;
    viewers: number;
    category: string | null;
  }>;
  continueWatching: unknown[];
  featuredLive: {
    id: string;
    slug: string;
    title: string;
    thumbnailUrl: string | null;
    streamer: string;
    viewerCount: number;
  } | null;
  trending: VideoCard[];
  newReleases: VideoCard[];
  movies: VideoCard[];
  featuredMovie: VideoCard | null;
};

export type VideoCard = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  viewsCount: number;
  type: string;
  category: string | null;
  channel: string;
  channelSlug: string;
  creatorId: string;
  playbackUrl?: string | null;
  videoUrl?: string | null;
  releaseYear?: number | null;
  tagline?: string | null;
};

function mockFeedHome(): FeedHomeResponse {
  return {
    liveNow: mockLiveStreams.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      thumbnailUrl: s.thumbnail,
      streamer: s.streamer,
      streamerSlug: s.streamerSlug,
      streamerAvatar: s.streamerAvatar,
      viewers: s.viewerCount,
      category: s.category,
    })),
    continueWatching: [],
    featuredLive: mockLiveStreams[0]
      ? {
          id: mockLiveStreams[0].id,
          slug: mockLiveStreams[0].slug,
          title: mockLiveStreams[0].title,
          thumbnailUrl: mockLiveStreams[0].thumbnail,
          streamer: mockLiveStreams[0].streamer,
          viewerCount: mockLiveStreams[0].viewerCount,
        }
      : null,
    trending: mockVideos.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnail,
      durationSeconds: 0,
      viewsCount: 0,
      type: v.type,
      category: v.category,
      channel: v.channel,
      channelSlug: v.channelSlug,
      creatorId: "",
    })),
    newReleases: mockMovies.map((m) => ({
      id: m.id,
      title: m.title,
      thumbnailUrl: m.poster,
      durationSeconds: 0,
      viewsCount: 0,
      type: "movie",
      category: "movies",
      channel: "Prysym",
      channelSlug: "prysym",
      creatorId: "",
    })),
    movies: mockMovies.map((m) => ({
      id: m.id,
      title: m.title,
      thumbnailUrl: m.poster,
      durationSeconds: 0,
      viewsCount: 0,
      type: "movie",
      category: "movies",
      channel: "Prysym",
      channelSlug: "prysym",
      creatorId: "",
    })),
    featuredMovie: mockMovies[0]
      ? {
          id: mockMovies[0].id,
          title: mockMovies[0].title,
          thumbnailUrl: mockMovies[0].poster,
          durationSeconds: 0,
          viewsCount: 0,
          type: "movie",
          category: "movies",
          channel: "Prysym",
          channelSlug: "prysym",
          creatorId: "",
        }
      : null,
  };
}

export function fetchFeedHome() {
  return withApiFallback(
    () => apiRequest<FeedHomeResponse>("/feed/home", { auth: false }),
    mockFeedHome(),
  );
}
