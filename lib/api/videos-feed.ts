import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import type { VideoCard } from "@/lib/api/feed";
import type { VideoDetail } from "@/lib/api/videos";

export type ApiVideoDetail = VideoDetail;

const EMPTY_SHORTS = { items: [] as VideoCard[], nextCursor: null as string | null };
const EMPTY_MOVIES = {
  items: [] as VideoCard[],
  meta: { page: 1, limit: 24, total: 0 },
};

export function fetchShortsFeed(cursor?: string) {
  return withApiFallback(
    () =>
      apiRequest<{ items: VideoCard[]; nextCursor: string | null }>(
        `/videos/feed/shorts${cursor ? `?cursor=${cursor}` : ""}`,
        { auth: false },
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

export function fetchVideo(id: string) {
  return apiRequest<ApiVideoDetail>(`/videos/${id}`, { auth: false });
}

export function fetchFeaturedMovie() {
  return withApiFallback(
    () => apiRequest<{ item: VideoCard | null }>("/videos/feed/movies/featured", { auth: false }),
    { item: null },
  );
}

export function toggleVideoLike(id: string) {
  return apiRequest<{ liked: boolean }>(`/videos/${id}/like`, { method: "POST" });
}

export function toggleVideoSave(id: string) {
  return apiRequest<{ saved: boolean }>(`/videos/${id}/save`, { method: "POST" });
}
