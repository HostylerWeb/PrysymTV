import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '@/lib/api/history';
import { mediaThumb } from '@/lib/api/map-content';
import { fetchMyPlaylists, type ApiPlaylistSummary } from '@/lib/api/playlists';
import { fetchMyLiked, fetchMySaved } from '@/lib/api/users';
import { filterContinueWatchingHistory } from '@/lib/continue-watching';
import { isLikedItemEnabled, isSavedItemEnabled } from '@/lib/content-services';
import { useContentServices } from '@/hooks/api/useContentServices';
import {
  mapHistoryToContinueWatching,
  mapLikedItemCard,
  mapSavedItemCard,
  type ProfileItemCard,
} from '@/lib/map-profile-items';
import type { ContinueWatchingItem } from '@/types/api';

export type ProfilePlaylistItem = {
  id: string;
  title: string;
  itemCount: number;
  coverUrl: string | null;
};

export type ProfileLibraryData = {
  continueWatching: ContinueWatchingItem[];
  saved: ProfileItemCard[];
  liked: ProfileItemCard[];
  playlists: ProfilePlaylistItem[];
};

function mapPlaylist(p: ApiPlaylistSummary): ProfilePlaylistItem {
  return {
    id: p.id,
    title: p.title,
    itemCount: p.itemCount,
    coverUrl: mediaThumb(p.coverUrl),
  };
}

export function useProfileLibrary(enabled = true) {
  const { services } = useContentServices();

  return useQuery({
    queryKey: ['profile', 'library', services],
    enabled,
    queryFn: async (): Promise<ProfileLibraryData> => {
      const [savedRes, likedRes, historyRes, playlistsRes] = await Promise.all([
        fetchMySaved(1, 24),
        fetchMyLiked(1, 24),
        fetchHistory(1, 12),
        fetchMyPlaylists(),
      ]);

      return {
        continueWatching: filterContinueWatchingHistory(historyRes.items, services)
          .map(mapHistoryToContinueWatching)
          .filter((item): item is ContinueWatchingItem => item != null),
        saved: savedRes.items
          .filter((item) => isSavedItemEnabled(services, item))
          .map(mapSavedItemCard)
          .filter((item): item is ProfileItemCard => item != null),
        liked: likedRes.items
          .filter((item) => isLikedItemEnabled(services, item))
          .map(mapLikedItemCard)
          .filter((item): item is ProfileItemCard => item != null),
        playlists: playlistsRes.items.map(mapPlaylist),
      };
    },
  });
}
