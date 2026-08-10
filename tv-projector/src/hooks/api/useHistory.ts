import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '@/lib/api/history';
import { mediaThumb } from '@/lib/api/map-content';
import type { HistoryItemRecord } from '@/types/api';
import { historyItemTitle } from '@/lib/tv-routes';
import { isHistoryItemEnabled } from '@/lib/content-services';
import { useContentServices } from '@/hooks/api/useContentServices';

export type HistoryItemView = HistoryItemRecord & {
  thumbnailUrl: string | null;
  displayTitle: string;
};

function historyThumbnail(item: HistoryItemRecord): string | null {
  if (item.video) {
    return mediaThumb(item.video.thumbnailUrl);
  }
  if (item.podcastEpisode) {
    return mediaThumb(item.podcastEpisode.coverUrl);
  }
  if (item.verticalEpisode) {
    return mediaThumb(
      item.verticalEpisode.thumbnailUrl ?? item.verticalEpisode.series.posterUrl,
    );
  }
  return null;
}

export function useHistoryFeed(page = 1, limit = 24) {
  const { services } = useContentServices();

  return useQuery({
    queryKey: ['history', page, limit, services],
    queryFn: async () => {
      const data = await fetchHistory(page, limit);
      return {
        items: data.items
          .filter((item) => isHistoryItemEnabled(services, item))
          .map((item): HistoryItemView => ({
            ...item,
            thumbnailUrl: historyThumbnail(item),
            displayTitle: historyItemTitle(item),
          })),
        meta: data.meta,
      };
    },
  });
}
