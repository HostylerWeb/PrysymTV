import type { ContinueWatchingFeedItem, HistoryItemRecord } from "@/lib/api/types";

const LONG_VIDEO_TYPES = new Set(["video", "movie", "series_episode"]);

export function isLongFormVideoType(type: string | undefined): boolean {
  return LONG_VIDEO_TYPES.has(type ?? "video");
}

/** Continue watching: vertical episodes + long-form videos only (no shorts or podcasts). */
export function isContinueWatchingHistoryItem(item: HistoryItemRecord): boolean {
  if (item.verticalEpisode) return true;
  if (item.podcastEpisode) return false;
  if (item.video) return isLongFormVideoType(item.video.type);
  return false;
}

export function filterContinueWatchingHistory(
  items: HistoryItemRecord[],
): HistoryItemRecord[] {
  return items.filter(isContinueWatchingHistoryItem);
}

export function filterContinueWatchingFeed(
  items: ContinueWatchingFeedItem[],
): ContinueWatchingFeedItem[] {
  return items.filter((item) => {
    if (item.contentType === "podcast_episode") return false;
    if (item.contentType === "vertical_episode") return true;
    if (item.contentType === "video") {
      return isLongFormVideoType(item.videoType);
    }
    return false;
  });
}
