import { apiRequest } from "@/lib/api-client";

export function fetchMyVerticalSeries() {
  return apiRequest<{
    items: Array<{
      id: string;
      slug: string;
      title: string;
      totalEpisodes: number;
      episodes: Array<{
        id: string;
        episodeNumber: number;
        title: string;
        status: string;
        description?: string | null;
        cliffhanger?: string | null;
      }>;
    }>;
  }>("/verticals/me/series");
}

export function createVerticalSeries(body: {
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  genre?: string;
  posterUrl?: string;
}) {
  return apiRequest("/verticals/series", { method: "POST", body });
}

export function createVerticalEpisode(
  seriesSlug: string,
  body: {
    episodeNumber: number;
    title: string;
    description?: string;
    cliffhanger?: string;
    durationSeconds?: number;
  },
) {
  return apiRequest(`/verticals/series/${seriesSlug}/episodes`, {
    method: "POST",
    body,
  });
}

export function attachVerticalEpisodeVideo(episodeId: string, videoId: string) {
  return apiRequest(`/verticals/episodes/${episodeId}/video`, {
    method: "PUT",
    body: { videoId },
  });
}

export function updateVerticalEpisode(
  episodeId: string,
  body: {
    episodeNumber?: number;
    title?: string;
    description?: string;
    cliffhanger?: string;
  },
) {
  return apiRequest(`/verticals/episodes/${episodeId}`, {
    method: "PATCH",
    body,
  });
}

export function deleteVerticalEpisode(episodeId: string) {
  return apiRequest(`/verticals/episodes/${episodeId}`, { method: "DELETE" });
}
