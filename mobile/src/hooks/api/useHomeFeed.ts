import { useQuery } from '@tanstack/react-query';
import { fetchFeedHome } from '@/lib/api/feed';
import {
  mapContinueWatchingItem,
  mapFeedLiveStream,
  mapVideoCard,
} from '@/lib/api/map-content';
import { useContentServices } from '@/hooks/api/useContentServices';
import {
  filterVideosByService,
  isContentServiceEnabled,
  isContinueWatchingItemEnabled,
} from '@/lib/content-services';
import type { LiveStream, VideoCard } from '@/types/api';

export type HomeFeedData = {
  liveNow: LiveStream[];
  featuredLive: LiveStream | null;
  continueWatching: ReturnType<typeof mapContinueWatchingItem>[];
  trending: VideoCard[];
  newReleases: VideoCard[];
  movies: VideoCard[];
  featuredMovie: VideoCard | null;
  heroMovieReason: 'new_release' | 'trending' | null;
};

export function useHomeFeed() {
  const { services } = useContentServices();

  return useQuery({
    queryKey: ['feed', 'home', services],
    // Poll every 30s so newly-started live streams appear without manual refresh.
    refetchInterval: 30_000,
    queryFn: async (): Promise<HomeFeedData> => {
      const data = await fetchFeedHome();
      const moviesEnabled = isContentServiceEnabled(services, 'movies');

      return {
        liveNow: data.liveNow.map(mapFeedLiveStream),
        featuredLive: data.featuredLive
          ? mapFeedLiveStream({
              ...data.featuredLive,
              streamerSlug: data.featuredLive.slug,
              viewers: data.featuredLive.viewerCount,
            })
          : null,
        continueWatching: data.continueWatching
          .map(mapContinueWatchingItem)
          .filter((item) => isContinueWatchingItemEnabled(services, item)),
        trending: filterVideosByService(data.trending.map(mapVideoCard), services),
        newReleases: moviesEnabled ? data.newReleases.map(mapVideoCard) : [],
        movies: moviesEnabled ? data.movies.map(mapVideoCard) : [],
        featuredMovie:
          moviesEnabled && data.featuredMovie ? mapVideoCard(data.featuredMovie) : null,
        heroMovieReason: moviesEnabled ? data.heroMovieReason : null,
      };
    },
  });
}
