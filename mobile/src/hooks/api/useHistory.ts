import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '@/lib/api/history';
import { mapHistoryListItem, type HistoryListItem } from '@/lib/map-profile-items';
import { filterContinueWatchingHistory } from '@/lib/continue-watching';
import { mapHistoryToContinueWatching } from '@/lib/map-profile-items';
import type { ContinueWatchingItem } from '@/types/api';

export type HistoryScreenData = {
  continueWatching: ContinueWatchingItem[];
  items: HistoryListItem[];
};

export function useHistoryScreen(page = 1, limit = 24) {
  return useQuery({
    queryKey: ['history', page, limit],
    queryFn: async (): Promise<HistoryScreenData> => {
      const res = await fetchHistory(page, limit);
      return {
        continueWatching: filterContinueWatchingHistory(res.items)
          .map(mapHistoryToContinueWatching)
          .filter((item): item is ContinueWatchingItem => item != null),
        items: res.items
          .map(mapHistoryListItem)
          .filter((item): item is HistoryListItem => item != null),
      };
    },
  });
}
