import type { VideoCard } from '@/types/api';

/** Route params for /watch/[id] — keep small; playback URL comes from React Query cache. */
export function watchVideoParams(item: Pick<VideoCard, 'id' | 'title' | 'thumbnailUrl'>) {
  return {
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl ?? '',
  };
}
