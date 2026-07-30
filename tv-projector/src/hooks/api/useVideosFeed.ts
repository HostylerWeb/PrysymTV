import { useQuery } from '@tanstack/react-query';
import { fetchVideosBrowse } from '@/lib/api/videos-feed';
import { mapVideoCard } from '@/lib/api/map-content';

export function useVideosFeed(page = 1, limit = 24) {
  return useQuery({
    queryKey: ['feed', 'videos', page, limit],
    queryFn: async () => {
      const data = await fetchVideosBrowse({ page, limit, mode: 'videos' });
      return {
        items: data.videos.items.map(mapVideoCard),
        meta: data.videos.meta,
      };
    },
  });
}
