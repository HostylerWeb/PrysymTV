import { useQuery } from '@tanstack/react-query';
import { fetchMoviesFeed } from '@/lib/api/videos-feed';
import { mapVideoCard } from '@/lib/api/map-content';

export function useMoviesFeed(page = 1, limit = 24) {
  return useQuery({
    queryKey: ['feed', 'movies', page, limit],
    queryFn: async () => {
      const data = await fetchMoviesFeed(page, limit);
      return {
        items: data.items.map(mapVideoCard),
        meta: data.meta,
      };
    },
  });
}
