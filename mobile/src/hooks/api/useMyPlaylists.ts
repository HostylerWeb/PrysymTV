import { useQuery } from '@tanstack/react-query';
import { fetchMyPlaylists } from '@/lib/api/playlists';
import { mediaThumb } from '@/lib/api/map-content';

export type MyPlaylistItem = {
  id: string;
  title: string;
  description: string | null;
  itemCount: number;
  type: string;
  coverUrl: string | null;
};

export function useMyPlaylists(enabled = true) {
  return useQuery({
    queryKey: ['playlists', 'me'],
    enabled,
    queryFn: async (): Promise<MyPlaylistItem[]> => {
      const res = await fetchMyPlaylists();
      return res.items.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        itemCount: p.itemCount,
        type: p.type,
        coverUrl: mediaThumb(p.coverUrl),
      }));
    },
  });
}
