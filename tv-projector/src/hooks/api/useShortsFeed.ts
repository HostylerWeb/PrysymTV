import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchShortsFeed } from '@/lib/api/videos-feed';
import { mapVideoCard } from '@/lib/api/map-content';
import type { VideoCard } from '@/types/api';

export function useShortsFeed(limit = 24, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['shorts', 'feed', limit],
    enabled,
    queryFn: async ({ pageParam }) => {
      const data = await fetchShortsFeed(pageParam as string | undefined, limit);
      return {
        items: data.items.map(mapVideoCard),
        nextCursor: data.nextCursor,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function flattenShortsPages(
  pages: Array<{ items: VideoCard[] }> | undefined,
): VideoCard[] {
  if (!pages?.length) return [];
  return pages.flatMap((p) => p.items);
}
