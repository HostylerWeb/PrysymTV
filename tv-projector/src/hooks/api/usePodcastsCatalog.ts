import { useQuery } from '@tanstack/react-query';
import {
  fetchFeaturedPodcastShow,
  fetchPodcastEpisodesFeed,
  fetchPodcastShows,
  fetchTrendingPodcastShows,
} from '@/lib/api/podcasts';
import { mapPodcastEpisode, mapPodcastShow } from '@/lib/api/map-content';
import type { PaginatedMeta, PodcastEpisode, PodcastShow } from '@/types/api';

export type PodcastsCatalogData = {
  featuredShow: PodcastShow | null;
  trendingShows: PodcastShow[];
  shows: PodcastShow[];
  episodes: PodcastEpisode[];
  episodesMeta: PaginatedMeta;
};

export function usePodcastsCatalog(page = 1, limit = 24, enabled = true) {
  return useQuery({
    queryKey: ['podcasts', 'catalog', page, limit],
    enabled,
    queryFn: async (): Promise<PodcastsCatalogData> => {
      const [featuredRes, trendingRes, episodesRes, showsRes] = await Promise.all([
        fetchFeaturedPodcastShow(),
        fetchTrendingPodcastShows(),
        fetchPodcastEpisodesFeed(page, limit),
        fetchPodcastShows(1, 24),
      ]);
      return {
        featuredShow: featuredRes.show ? mapPodcastShow(featuredRes.show) : null,
        trendingShows: trendingRes.items.map(mapPodcastShow),
        shows: showsRes.items.map(mapPodcastShow),
        episodes: episodesRes.items.map(mapPodcastEpisode),
        episodesMeta: episodesRes.meta,
      };
    },
  });
}
