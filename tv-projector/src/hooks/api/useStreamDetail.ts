import { useQuery } from '@tanstack/react-query';
import { fetchStream } from '@/lib/api/streams';
import { mapStreamDetail, mediaThumb } from '@/lib/api/map-content';
import { resolvePlaybackUrl } from '@/lib/media-url';
import type { LiveStream } from '@/types/api';
import type { StreamStudioInfo } from '@/lib/api/streams';

export type StreamDetailView = LiveStream & {
  playbackSource: string | null;
  description?: string | null;
  slug: string;
  creatorId: string;
  status: string;
  isPaid?: boolean;
  hasAccess?: boolean;
  entryCoinCost?: number | null;
  entryPriceUsd?: number | null;
  hlsPlaybackUrl?: string | null;
  studio?: StreamStudioInfo;
};

export function useStreamDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['stream', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<StreamDetailView> => {
      const raw = await fetchStream(id!);
      const base = mapStreamDetail(raw);
      const hasAccess = raw.hasAccess !== false;
      return {
        ...base,
        slug: raw.slug,
        creatorId: raw.creatorId,
        status: raw.status,
        studio: raw.studio,
        isPaid: raw.isPaid,
        hasAccess: raw.hasAccess,
        entryCoinCost: raw.entryCoinCost,
        entryPriceUsd: raw.entryPriceUsd,
        hlsPlaybackUrl: hasAccess ? raw.hlsPlaybackUrl ?? null : null,
        thumbnailUrl: mediaThumb(raw.thumbnail),
        avatarUrl: mediaThumb(raw.streamerAvatar),
        description: raw.description ?? null,
        playbackSource: hasAccess ? resolvePlaybackUrl(raw) : null,
      };
    },
    refetchInterval: 3_000,
  });
}
