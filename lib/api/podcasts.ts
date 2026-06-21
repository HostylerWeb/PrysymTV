import { apiRequest } from "@/lib/api-client";
import { withApiFallback } from "@/lib/api/fallback";
import { formatDuration, formatRelativeTime, formatViewCount, videoThumbnail } from "@/lib/format-media";
import type { PaginatedMeta } from "@/lib/api/types";

export type PodcastShowCard = {
  id: string;
  title: string;
  host: string;
  hostSlug: string;
  cover: string;
  category: string;
  followers: string;
  episodes: number;
  description?: string;
  banner?: string;
  latestEpisodeTitle?: string;
};

export type PodcastEpisodeCard = {
  id: string;
  showId: string;
  podcast: string;
  title: string;
  duration: string;
  durationSeconds: number;
  date: string;
  cover: string;
  plays: string;
  audioUrl: string | null;
  videoUrl?: string | null;
  mediaType?: "audio" | "video";
  description?: string;
  liked?: boolean;
  saved?: boolean;
};

type ApiShow = {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  category?: string | null;
  followersCount?: number;
  creator?: { username: string; displayName?: string | null };
  _count?: { episodes: number };
};

type ApiEpisode = {
  id: string;
  showId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  audioUrl: string | null;
  videoUrl?: string | null;
  mediaType?: "audio" | "video";
  durationSeconds?: number;
  playsCount?: number;
  publishedAt?: string | null;
  createdAt?: string;
  show?: { id: string; title: string; coverUrl?: string | null };
  creator?: { username: string; displayName?: string | null; avatarUrl?: string | null };
};

function mapShow(raw: ApiShow): PodcastShowCard {
  const host = raw.creator?.displayName ?? raw.creator?.username ?? "Host";
  const hostSlug = raw.creator?.username ?? "creator";
  return {
    id: raw.id,
    title: raw.title,
    host,
    hostSlug,
    cover: videoThumbnail(raw.coverUrl),
    category: raw.category ?? "General",
    followers: formatViewCount(raw.followersCount ?? 0),
    episodes: raw._count?.episodes ?? 0,
    description: raw.description ?? undefined,
    banner: raw.coverUrl ? videoThumbnail(raw.coverUrl) : undefined,
  };
}

function mapEpisode(raw: ApiEpisode): PodcastEpisodeCard {
  const showTitle = raw.show?.title ?? "Podcast";
  const when = raw.publishedAt ?? raw.createdAt ?? new Date().toISOString();
  return {
    id: raw.id,
    showId: raw.showId,
    podcast: showTitle,
    title: raw.title,
    duration: formatDuration(raw.durationSeconds ?? 0),
    durationSeconds: raw.durationSeconds ?? 0,
    date: formatRelativeTime(when),
    cover: videoThumbnail(raw.coverUrl ?? raw.show?.coverUrl),
    plays: formatViewCount(raw.playsCount ?? 0),
    audioUrl: raw.audioUrl ?? null,
    videoUrl: raw.videoUrl ?? null,
    mediaType: raw.mediaType ?? (raw.videoUrl ? "video" : "audio"),
    description: raw.description ?? undefined,
  };
}

export function fetchPodcastShows(page = 1, limit = 24) {
  return withApiFallback(
    () =>
      apiRequest<{ items: ApiShow[]; meta: PaginatedMeta }>(
        `/podcasts/shows?page=${page}&limit=${limit}`,
        { auth: false },
      ).then((res) => ({
        items: res.items.map(mapShow),
        meta: res.meta,
      })),
    { items: [], meta: { page: 1, limit, total: 0 } },
  );
}

type ApiEpisodeWithFlags = ApiEpisode & { liked?: boolean; saved?: boolean };

export function fetchPodcastEpisodesFeed(page = 1, limit = 30) {
  return withApiFallback(
    () =>
      apiRequest<{ items: ApiEpisodeWithFlags[]; meta: PaginatedMeta }>(
        `/podcasts/episodes/feed?page=${page}&limit=${limit}`,
      ).then((res) => ({
        items: res.items.map((e) => ({
          ...mapEpisode(e),
          liked: e.liked ?? false,
          saved: e.saved ?? false,
        })),
        meta: res.meta,
      })),
    { items: [], meta: { page: 1, limit, total: 0 } },
  );
}

export function fetchPodcastFeatured(limit = 6) {
  return withApiFallback(
    () =>
      apiRequest<{ items: ApiShow[] }>(`/podcasts/shows/featured?limit=${limit}`, {
        auth: false,
      }).then((res) => res.items.map(mapShow)),
    [],
  );
}

export function fetchPodcastTrendingShows(limit = 12) {
  return withApiFallback(
    () =>
      apiRequest<{ items: ApiShow[] }>(
        `/podcasts/shows/trending?limit=${limit}`,
        { auth: false },
      ).then((res) => res.items.map(mapShow)),
    [],
  );
}

export function fetchPodcastEpisode(id: string) {
  return apiRequest<ApiEpisode & { liked?: boolean; saved?: boolean }>(
    `/podcasts/episodes/${id}`,
  );
}

export function recordPodcastPlay(episodeId: string) {
  return apiRequest<{ ok: boolean }>(`/podcasts/episodes/${episodeId}/play`, {
    method: "POST",
  });
}

export function togglePodcastLike(episodeId: string) {
  return apiRequest<{ liked: boolean }>(`/podcasts/episodes/${episodeId}/like`, {
    method: "POST",
  });
}

export function togglePodcastSave(episodeId: string) {
  return apiRequest<{ saved: boolean }>(`/podcasts/episodes/${episodeId}/save`, {
    method: "POST",
  });
}

export function mapPodcastEpisodeDetail(raw: ApiEpisode & { liked?: boolean; saved?: boolean }) {
  const card = mapEpisode(raw);
  const publishedAt = raw.publishedAt ?? raw.createdAt ?? new Date().toISOString();
  return {
    ...card,
    publishedAt,
    show: raw.show
      ? {
          id: raw.show.id,
          title: raw.show.title,
          cover: videoThumbnail(raw.show.coverUrl),
        }
      : null,
    hostSlug: raw.creator?.username,
    hostName: raw.creator?.displayName ?? raw.creator?.username ?? "Host",
    creatorId: (raw.creator as { id?: string } | undefined)?.id,
    liked: raw.liked ?? false,
    saved: raw.saved ?? false,
  };
}
