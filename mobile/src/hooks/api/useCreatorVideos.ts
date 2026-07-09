import { useQuery } from '@tanstack/react-query';
import { fetchCreatorVideos } from '@/lib/api/users';
import { mapVideoCard } from '@/lib/api/map-content';
import type { PaginatedMeta, VideoCard } from '@/types/api';
import { normalizeUsernameSlug } from '@/lib/username-slug';

export type CreatorVideosData = {
  videos: VideoCard[];
  meta: PaginatedMeta;
};

export function useCreatorVideos(username: string | undefined, page = 1, limit = 48) {
  const slug = username ? normalizeUsernameSlug(username) : '';
  return useQuery({
    queryKey: ['creator', 'videos', slug, page, limit],
    enabled: Boolean(slug),
    queryFn: async (): Promise<CreatorVideosData> => {
      const data = await fetchCreatorVideos(slug, page, limit);
      return {
        videos: data.items.map(mapVideoCard),
        meta: data.meta,
      };
    },
  });
}
