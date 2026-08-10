import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '@/lib/api/history';
import { mapHistoryListItem, type HistoryListItem } from '@/lib/map-profile-items';
import { filterContinueWatchingHistory } from '@/lib/continue-watching';
import { isHistoryItemEnabled } from '@/lib/content-services';
import { useContentServices } from '@/hooks/api/useContentServices';
import { mapHistoryToContinueWatching } from '@/lib/map-profile-items';
import type { ContinueWatchingItem } from '@/types/api';

export type HistoryScreenData = {
  continueWatching: ContinueWatchingItem[];
  items: HistoryListItem[];
};

export function useHistoryScreen(page = 1, limit = 24) {
  const { services } = useContentServices();

  return useQuery({
    queryKey: ['history', page, limit, services],
    queryFn: async (): Promise<HistoryScreenData> => {
      const res = await fetchHistory(page, limit);
      return {
        continueWatching: filterContinueWatchingHistory(res.items, services)
          .map(mapHistoryToContinueWatching)
          .filter((item): item is ContinueWatchingItem => item != null),
        items: res.items
          .filter((item) => isHistoryItemEnabled(services, item))
          .map(mapHistoryListItem)
          .filter((item): item is HistoryListItem => item != null),
      };
    },
  });
}
