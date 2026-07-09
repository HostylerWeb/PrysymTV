import { useQuery } from '@tanstack/react-query';
import { fetchPlaylist } from '@/lib/api/playlists';
import { mediaThumb } from '@/lib/api/map-content';
import type { PlaylistDetail } from '@/types/api';

export function usePlaylistDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['playlist', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<PlaylistDetail> => {
      const data = await fetchPlaylist(id!);
      return {
        ...data,
        coverUrl: mediaThumb(data.coverUrl),
        items: data.items.map((item) => ({
          ...item,
          coverUrl: mediaThumb(item.coverUrl),
        })),
      };
    },
  });
}
