import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import type { VideoCard } from "@/lib/api/feed";
import type { VideoDetail } from "@/lib/api/videos";

export type ShortVideoCard = VideoCard & {
  commentsCount?: number;
  liked?: boolean;
  saved?: boolean;
  disliked?: boolean;
};

export type ApiVideoDetail = VideoDetail & {
  liked?: boolean;
  saved?: boolean;
  disliked?: boolean;
  dislikesCount?: number;
  isFollowing?: boolean;
};

const EMPTY_SHORTS = { items: [] as ShortVideoCard[], nextCursor: null as string | null };
const EMPTY_MOVIES = {
  items: [] as VideoCard[],
  meta: { page: 1, limit: 24, total: 0 },
};

export function fetchShortsFeed(cursor?: string) {
  return withApiFallback(
    () =>
      apiRequest<{ items: ShortVideoCard[]; nextCursor: string | null }>(
        `/videos/feed/shorts${cursor ? `?cursor=${cursor}` : ""}`,
      ),
    EMPTY_SHORTS,
  );
}

export function fetchMoviesFeed(page = 1) {
  return withApiFallback(
    () =>
      apiRequest<{ items: VideoCard[]; meta: { page: number; limit: number; total: number } }>(
        `/videos/feed/movies?page=${page}`,
        { auth: false },
      ),
    EMPTY_MOVIES,
  );
}

/** Sends Bearer when logged in so API returns liked/saved/disliked/isFollowing. */
export function fetchVideo(id: string) {
  return apiRequest<ApiVideoDetail>(`/videos/${id}`);
}

export function fetchFeaturedMovie() {
  return withApiFallback(
    () => apiRequest<{ item: VideoCard | null }>("/videos/feed/movies/featured", { auth: false }),
    { item: null },
  );
}

export function recordVideoView(id: string) {
  return apiRequest<{ success: boolean; viewsCount: number }>(`/videos/${id}/view`, {
    method: "POST",
    auth: false,
  });
}

export function toggleVideoLike(id: string) {
  return apiRequest<{ liked: boolean; disliked?: boolean }>(`/videos/${id}/like`, {
    method: "POST",
  });
}

export function toggleVideoDislike(id: string) {
  return apiRequest<{ disliked: boolean; liked?: boolean }>(`/videos/${id}/dislike`, {
    method: "POST",
  });
}

export function toggleVideoSave(id: string) {
  return apiRequest<{ saved: boolean }>(`/videos/${id}/save`, { method: "POST" });
}
