import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVideo } from '@/lib/api/videos';
import { resolvePlaybackUrl } from '@/lib/media-url';
import type { VideoDetail } from '@/types/api';

export function videoDetailQueryKey(id: string) {
  return ['video', 'detail', id] as const;
}

export function useVideoDetail(id: string | undefined) {
  return useQuery({
    queryKey: videoDetailQueryKey(id ?? ''),
    queryFn: () => fetchVideo(id!),
    enabled: Boolean(id),
    staleTime: 10 * 60 * 1000,
  });
}

export function prefetchVideoDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  return queryClient.prefetchQuery({
    queryKey: videoDetailQueryKey(id),
    queryFn: () => fetchVideo(id),
    staleTime: 10 * 60 * 1000,
  });
}

export function resolveVideoPlayback(detail: VideoDetail | undefined) {
  if (!detail) return null;
  return resolvePlaybackUrl(detail);
}
