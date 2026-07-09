import { useQuery } from '@tanstack/react-query';
import { fetchStream } from '@/lib/api/streams';
import { mapStreamDetail, mediaThumb } from '@/lib/api/map-content';
import { resolvePlaybackUrl } from '@/lib/media-url';
import type { LiveStream } from '@/types/api';

export type StreamDetailView = LiveStream & {
  playbackSource: string | null;
  description?: string | null;
  slug: string;
  creatorId: string;
};

export function useStreamDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['stream', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<StreamDetailView> => {
      const raw = await fetchStream(id!);
      const base = mapStreamDetail(raw);
      return {
        ...base,
        slug: raw.slug,
        creatorId: raw.creatorId,
        thumbnailUrl: mediaThumb(raw.thumbnail),
        avatarUrl: mediaThumb(raw.streamerAvatar),
        description: raw.description ?? null,
        playbackSource: resolvePlaybackUrl(raw),
      };
    },
    refetchInterval: 30_000,
  });
}
