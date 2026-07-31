import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { fetchServedAd } from '@/lib/api/ads';
import { prefetchVideoDetail } from '@/hooks/api/useVideoDetail';
import { watchVideoParams } from '@/lib/watch-params';
import { watchDebug, watchDebugReset, watchDebugUrl } from '@/lib/watch-debug';
import type { VideoCard } from '@/types/api';

const AD_PEEK_QUERY_KEY = (placement: string) => ['ad', 'peek', placement];

/** Prefetch video + navigate to watch screen with thumbnail visible immediately. */
export function useOpenWatch() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (item: Pick<VideoCard, 'id' | 'title' | 'thumbnailUrl'>) => {
    watchDebugReset(`openWatch:${item.id}`);
    watchDebug('nav.openWatch', {
      id: item.id,
      title: item.title,
      thumbnailUrl: watchDebugUrl(item.thumbnailUrl),
    });
    const prefetchStart = Date.now();
    void prefetchVideoDetail(queryClient, item.id).then(() => {
      watchDebug('nav.prefetchDone', {
        id: item.id,
        elapsedMs: Date.now() - prefetchStart,
        fromCache: queryClient.getQueryData(['video', 'detail', item.id]) != null,
      });
    });
    void queryClient.prefetchQuery({
      queryKey: AD_PEEK_QUERY_KEY('movie_preroll'),
      queryFn: () => fetchServedAd('movie_preroll', { peek: true }),
      staleTime: 30_000,
    });
    if (item.thumbnailUrl) {
      void Image.prefetch(item.thumbnailUrl).then(() => {
        watchDebug('nav.thumbnailPrefetchDone', {
          id: item.id,
          elapsedMs: Date.now() - prefetchStart,
        });
      });
    }
    router.push({
      pathname: '/watch/[id]',
      params: watchVideoParams(item),
    });
    watchDebug('nav.routerPush', { id: item.id, pathname: '/watch/[id]' });
  };
}

/** Prefetch short + navigate to shorts player. */
export function useOpenShort() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (item: Pick<VideoCard, 'id' | 'title' | 'thumbnailUrl'>) => {
    watchDebugReset(`openShort:${item.id}`);
    watchDebug('nav.openShort', {
      id: item.id,
      title: item.title,
      thumbnailUrl: watchDebugUrl(item.thumbnailUrl),
    });
    void prefetchVideoDetail(queryClient, item.id);
    if (item.thumbnailUrl) void Image.prefetch(item.thumbnailUrl);
    router.push({
      pathname: '/shorts/[id]',
      params: watchVideoParams(item),
    });
  };
}

export function prefetchWatchItem(
  queryClient: ReturnType<typeof useQueryClient>,
  item: Pick<VideoCard, 'id' | 'thumbnailUrl'>,
) {
  void prefetchVideoDetail(queryClient, item.id);
  if (item.thumbnailUrl) void Image.prefetch(item.thumbnailUrl);
}
