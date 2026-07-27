import { useQuery } from '@tanstack/react-query';
import { fetchMyPodcastShows } from '@/lib/api/podcasts';
import { fetchMyVideos } from '@/lib/api/users';
import { fetchMyVerticalSeries } from '@/lib/api/verticals';
import { mediaThumb } from '@/lib/api/map-content';
import { videoRecordToCard } from '@/lib/map-profile-items';
import type { VideoCard } from '@/types/api';

export type MyContentData = {
  videos: VideoCard[];
  shorts: VideoCard[];
  verticals: Array<{
    slug: string;
    title: string;
    episodeCount: number;
    episodes: Array<{
      id: string;
      episodeNumber: number;
      title: string;
    }>;
  }>;
  podcasts: Array<{
    id: string;
    title: string;
    episodeCount: number;
    episodes: Array<{
      id: string;
      title: string;
    }>;
  }>;
};

export function useMyCreatorContent(enabled = true) {
  return useQuery({
    queryKey: ['profile', 'my-content'],
    enabled,
    queryFn: async (): Promise<MyContentData> => {
      const [videosRes, seriesRes, podcastsRes] = await Promise.all([
        fetchMyVideos(1, 100),
        fetchMyVerticalSeries().catch(() => ({ items: [] })),
        fetchMyPodcastShows().catch(() => ({ items: [] })),
      ]);

      const cards = videosRes.items.map(videoRecordToCard);
      return {
        videos: cards.filter((v) => v.type === 'video' || v.type === 'movie'),
        shorts: cards.filter((v) => v.type === 'short'),
        verticals: seriesRes.items.map((s) => ({
          slug: s.slug,
          title: s.title,
          episodeCount: s.totalEpisodes ?? s.episodeCount ?? 0,
          episodes: (s.episodes ?? []).map((ep) => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
          })),
        })),
        podcasts: podcastsRes.items.map((s) => ({
          id: s.id,
          title: s.title,
          episodeCount: s._count.episodes,
          episodes: (s.episodes ?? []).map((ep) => ({
            id: ep.id,
            title: ep.title,
          })),
        })),
      };
    },
  });
}
