import type { HistoryItemRecord } from '@/types/api';
import {
  type ContentServicesSettings,
  isHistoryItemEnabled,
} from '@/lib/content-services';

const LONG_VIDEO_TYPES = new Set(['video', 'movie', 'series_episode']);

export function isLongFormVideoType(type: string | undefined): boolean {
  return LONG_VIDEO_TYPES.has(type ?? 'video');
}

export function isContinueWatchingHistoryItem(item: HistoryItemRecord): boolean {
  if (item.verticalEpisode) return true;
  if (item.podcastEpisode) return false;
  if (item.video) return isLongFormVideoType(item.video.type);
  return false;
}

export function filterContinueWatchingHistory(
  items: HistoryItemRecord[],
  services?: ContentServicesSettings | null,
): HistoryItemRecord[] {
  return items
    .filter(isContinueWatchingHistoryItem)
    .filter((item) => !services || isHistoryItemEnabled(services, item));
}
