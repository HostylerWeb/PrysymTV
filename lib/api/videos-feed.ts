import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import type { VideoCard } from "@/lib/api/feed";
import { mockMovies, mockShorts } from "@/lib/mock-data";

export function fetchShortsFeed(cursor?: string) {
  return withApiFallback(
    () =>
      apiRequest<{ items: VideoCard[]; nextCursor: string | null }>(
        `/videos/feed/shorts${cursor ? `?cursor=${cursor}` : ""}`,
        { auth: false },
      ),
    {
      items: mockShorts.map((s, i) => ({
        id: String(s.id),
        title: s.caption,
        thumbnailUrl: null,
        durationSeconds: 60,
        viewsCount: 0,
        type: "short",
        category: "shorts",
        channel: s.username,
        channelSlug: s.userSlug,
        creatorId: "",
      })),
      nextCursor: null,
    },
  );
}

export function fetchMoviesFeed(page = 1) {
  return withApiFallback(
    () =>
      apiRequest<{ items: VideoCard[]; meta: { page: number; limit: number; total: number } }>(
        `/videos/feed/movies?page=${page}`,
        { auth: false },
      ),
    {
      items: mockMovies.map((m) => ({
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
      meta: { page: 1, limit: 24, total: mockMovies.length },
    },
  );
}

export type ApiVideoDetail = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  hlsMasterUrl: string | null;
  durationSeconds: number;
  viewsCount: number;
  likesCount: number;
  type: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export function fetchVideo(id: string) {
  return apiRequest<ApiVideoDetail>(`/videos/${id}`, { auth: false });
}
