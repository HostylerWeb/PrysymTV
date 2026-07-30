import { useQuery } from '@tanstack/react-query';
import {
  fetchVerticalEpisode,
  postVerticalEpisodeView,
} from '@/lib/api/verticals';
import { mediaThumb } from '@/lib/api/map-content';
import { resolvePlaybackUrl } from '@/lib/media-url';
import type { VerticalEpisodePlayback } from '@/types/api';

export type VerticalEpisodeView = VerticalEpisodePlayback & {
  playbackSource: string | null;
};

export function useVerticalEpisodePlayback(
  slug: string | undefined,
  episodeNumber: number,
) {
  return useQuery({
    queryKey: ['vertical', slug, 'episode', episodeNumber],
    enabled: Boolean(slug) && episodeNumber > 0,
    queryFn: async (): Promise<VerticalEpisodeView> => {
      const data = await fetchVerticalEpisode(slug!, episodeNumber);
      void postVerticalEpisodeView(data.episode.id).catch(() => {});
      return {
        ...data,
        series: {
          ...data.series,
          posterUrl: mediaThumb(data.series.posterUrl),
        },
        playbackSource: resolvePlaybackUrl(data.episode),
      };
    },
  });
}
