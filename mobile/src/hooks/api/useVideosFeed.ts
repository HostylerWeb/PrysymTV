import { useQuery } from '@tanstack/react-query';
import { fetchVideosBrowse, type VideosBrowseParams } from '@/lib/api/videos-feed';
import { mapFeedLiveStream, mapVideoCard } from '@/lib/api/map-content';
import type { LiveStream, PaginatedMeta, VideoCard } from '@/types/api';

export type VideosFeedParams = {
  page?: number;
  limit?: number;
  vertical?: string;
  sort?: 'views' | 'newest';
  mode?: 'all' | 'videos' | 'live';
  q?: string;
};

export type VideosFeedData = {
  videos: VideoCard[];
  live: LiveStream[];
  meta: PaginatedMeta;
};

function mapBrowseParams(params: VideosFeedParams): VideosBrowseParams {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 24,
    vertical: params.vertical,
    sort: params.sort,
    mode: params.mode ?? 'all',
    q: params.q?.trim() || undefined,
  };
}

export function useVideosFeed(params: VideosFeedParams = {}) {
  const browse = mapBrowseParams(params);
  return useQuery({
    queryKey: ['videos', 'browse', browse],
    queryFn: async (): Promise<VideosFeedData> => {
      const data = await fetchVideosBrowse(browse);
      return {
        videos: data.videos.items.map(mapVideoCard),
        live: (data.live.items as Parameters<typeof mapFeedLiveStream>[0][]).map(mapFeedLiveStream),
        meta: data.videos.meta,
      };
    },
  });
}
