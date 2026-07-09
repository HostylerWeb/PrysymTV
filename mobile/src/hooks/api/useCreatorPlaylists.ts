import { useQuery } from '@tanstack/react-query';
import { fetchCreatorPlaylists } from '@/lib/api/playlists';
import { mediaThumb } from '@/lib/api/map-content';
import { normalizeUsernameSlug } from '@/lib/username-slug';

export type CreatorPlaylistItem = {
  id: string;
  title: string;
  itemCount: number;
  coverUrl: string | null;
};

export function useCreatorPlaylists(username: string | undefined) {
  const slug = username ? normalizeUsernameSlug(username) : '';
  return useQuery({
    queryKey: ['creator', 'playlists', slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<CreatorPlaylistItem[]> => {
      const data = await fetchCreatorPlaylists(slug);
      return data.items.map((p) => ({
        id: p.id,
        title: p.title,
        itemCount: p.itemCount,
        coverUrl: mediaThumb(p.coverUrl),
      }));
    },
  });
}
