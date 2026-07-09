import { useQuery } from '@tanstack/react-query';
import { fetchVideo, postVideoView } from '@/lib/api/videos';
import { mediaThumb } from '@/lib/api/map-content';
import { resolvePlaybackUrl } from '@/lib/media-url';
import type { VideoDetail } from '@/types/api';

export type VideoDetailView = VideoDetail & {
  playbackSource: string | null;
  thumbnailUrl: string | null;
  posterUrl: string | null;
};

function mapVideoDetail(raw: VideoDetail): VideoDetailView {
  return {
    ...raw,
    thumbnailUrl: mediaThumb(raw.thumbnailUrl ?? raw.posterUrl),
    posterUrl: mediaThumb(raw.posterUrl ?? raw.thumbnailUrl),
    playbackSource: resolvePlaybackUrl(raw),
  };
}

export function useVideoDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['video', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const data = await fetchVideo(id!);
      void postVideoView(id!).catch(() => {});
      return mapVideoDetail(data);
    },
  });
}
