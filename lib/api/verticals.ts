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
  };
  episode: {
    id: string;
    episodeNumber: number;
    title: string;
    videoUrl: string | null;
    durationSeconds: number;
    cliffhanger: string | null;
  };
  nextEpisode: { episodeNumber: number; title: string } | null;
};

const MOCK_SERIES: VerticalSeriesCard[] = [
  {
    id: "mock-1",
    slug: "midnight-contract",
    title: "Midnight Contract",
    tagline: "Every choice has a price",
    posterUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=900&fit=crop",
    genre: "Thriller",
    totalEpisodes: 5,
  },
];

export function fetchVerticalSeriesList() {
  return withApiFallback(
    () => apiRequest<{ items: VerticalSeriesCard[] }>("/verticals", { auth: false }),
    { items: MOCK_SERIES },
  );
}

export function fetchVerticalSeries(slug: string) {
  return apiRequest<VerticalSeriesDetail>(`/verticals/${slug}`, { auth: false });
}

export function fetchVerticalEpisode(slug: string, episodeNumber: number) {
  return apiRequest<VerticalEpisodePlayback>(
    `/verticals/${slug}/episodes/${episodeNumber}`,
    { auth: false },
  );
}
