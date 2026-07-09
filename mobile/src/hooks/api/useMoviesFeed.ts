import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedMovie, fetchMoviesFeed } from '@/lib/api/videos-feed';
import { mapVideoCard } from '@/lib/api/map-content';
import type { PaginatedMeta, VideoCard } from '@/types/api';

export type MoviesFeedData = {
  featured: VideoCard | null;
  items: VideoCard[];
  meta: PaginatedMeta;
};

export function useMoviesFeed(page = 1, limit = 48) {
  return useQuery({
    queryKey: ['movies', 'feed', page, limit],
    queryFn: async (): Promise<MoviesFeedData> => {
      const [featured, feed] = await Promise.all([
        fetchFeaturedMovie(),
        fetchMoviesFeed(page, limit),
      ]);
      return {
        featured: featured ? mapVideoCard(featured) : null,
        items: feed.items.map(mapVideoCard),
        meta: feed.meta,
      };
    },
  });
}
