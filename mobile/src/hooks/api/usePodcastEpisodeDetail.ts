import { useQuery } from '@tanstack/react-query';
import {
  fetchPodcastEpisode,
  postPodcastEpisodePlay,
} from '@/lib/api/podcasts';
import { mediaThumb } from '@/lib/api/map-content';
import { resolvePlaybackUrl } from '@/lib/media-url';
import type { PodcastEpisodeDetail } from '@/types/api';

export type PodcastEpisodeView = PodcastEpisodeDetail & {
  playbackSource: string | null;
  coverUrl: string | null;
};

export function usePodcastEpisodeDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['podcast', 'episode', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<PodcastEpisodeView> => {
      const data = await fetchPodcastEpisode(id!);
      void postPodcastEpisodePlay(id!).catch(() => {});
      return {
        ...data,
        coverUrl: mediaThumb(data.coverUrl ?? data.show?.coverUrl),
        playbackSource: resolvePlaybackUrl(data),
      };
    },
  });
}
