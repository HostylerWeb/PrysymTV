import { useQuery } from '@tanstack/react-query';
import { fetchFeedHome } from '@/lib/api/feed';
import {
  mapContinueWatchingItem,
  mapFeedLiveStream,
  mapVideoCard,
} from '@/lib/api/map-content';
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
  return useQuery({
    queryKey: ['feed', 'home'],
    queryFn: async (): Promise<HomeFeedData> => {
      const data = await fetchFeedHome();
      return {
        liveNow: data.liveNow.map(mapFeedLiveStream),
        featuredLive: data.featuredLive
          ? mapFeedLiveStream({
              ...data.featuredLive,
              streamerSlug: data.featuredLive.slug,
              viewers: data.featuredLive.viewerCount,
            })
          : null,
        continueWatching: data.continueWatching.map(mapContinueWatchingItem),
        trending: data.trending.map(mapVideoCard),
        newReleases: data.newReleases.map(mapVideoCard),
        movies: data.movies.map(mapVideoCard),
        featuredMovie: data.featuredMovie ? mapVideoCard(data.featuredMovie) : null,
        heroMovieReason: data.heroMovieReason,
      };
    },
  });
}
