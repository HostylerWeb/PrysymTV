import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";

export type VerticalSeriesCard = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  posterUrl: string | null;
  genre: string | null;
  totalEpisodes: number;
};

export type VerticalSeriesDetail = VerticalSeriesCard & {
  description: string | null;
  bannerUrl: string | null;
  episodes: Array<{
    id: string;
    episodeNumber: number;
    title: string;
    thumbnailUrl: string | null;
    durationSeconds: number;
    cliffhanger: string | null;
  }>;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};

export type VerticalEpisodePlayback = {
  series: {
    id: string
    slug: string
    title: string
    creatorId: string | null
    posterUrl?: string | null
    saved?: boolean
  };
  episode: {
    id: string;
    episodeNumber: number;
    title: string;
    videoUrl: string | null;
    durationSeconds: number;
    cliffhanger: string | null;
    viewsCount?: number;
    likesCount?: number;
    liked?: boolean;
    saved?: boolean;
  };
  nextEpisode: { episodeNumber: number; title: string } | null;
};

export function fetchVerticalSeriesList() {
  return withApiFallback(
    () => apiRequest<{ items: VerticalSeriesCard[] }>("/verticals", { auth: false }),
    { items: [] },
  );
}

export function fetchVerticalSeries(slug: string) {
  return apiRequest<VerticalSeriesDetail>(`/verticals/${slug}`, { auth: false });
}

export function fetchVerticalEpisode(slug: string, episodeNumber: number) {
  return apiRequest<VerticalEpisodePlayback>(
    `/verticals/${slug}/episodes/${episodeNumber}`,
  );
}

export function recordVerticalEpisodeView(episodeId: string) {
  return apiRequest<{ success: boolean; viewsCount: number }>(
    `/verticals/episodes/${episodeId}/view`,
    { method: "POST", auth: false },
  );
}

export function toggleVerticalEpisodeLike(episodeId: string) {
  return apiRequest<{ liked: boolean }>(`/verticals/episodes/${episodeId}/like`, {
    method: "POST",
  });
}

export function toggleVerticalEpisodeSave(episodeId: string) {
  return apiRequest<{ saved: boolean }>(`/verticals/episodes/${episodeId}/save`, {
    method: "POST",
  });
}

export function toggleVerticalSeriesSave(seriesId: string) {
  return apiRequest<{ saved: boolean }>(`/verticals/series/${seriesId}/save`, {
    method: "POST",
  });
}
