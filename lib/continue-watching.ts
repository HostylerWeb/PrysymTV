import type { ContinueWatchingFeedItem, HistoryItemRecord } from "@/lib/api/types";
import {
  type ContentServicesSettings,
  isContinueWatchingItemEnabled,
  isHistoryItemEnabled,
} from "@/lib/content-services";

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
  services?: ContentServicesSettings | null,
): HistoryItemRecord[] {
  return items
    .filter(isContinueWatchingHistoryItem)
    .filter((item) => !services || isHistoryItemEnabled(services, item));
}

export function filterContinueWatchingFeed(
  items: ContinueWatchingFeedItem[],
  services?: ContentServicesSettings | null,
): ContinueWatchingFeedItem[] {
  return items
    .filter((item) => {
      if (item.contentType === "podcast_episode") return false;
      if (item.contentType === "vertical_episode") return true;
      if (item.contentType === "video") {
        return isLongFormVideoType(item.videoType);
      }
      return false;
    })
    .filter((item) => !services || isContinueWatchingItemEnabled(services, item));
}

export function continueWatchingHref(item: ContinueWatchingFeedItem): string {
  const t = Math.max(0, Math.floor(item.progressSeconds));
  const resume = t >= 5 ? `?t=${t}` : "";

  if (item.contentType === "video") {
    if (item.videoType === "movie") return `/movie/${item.contentId}${resume}`;
    return `/watch/${item.contentId}${resume}`;
  }
  if (item.seriesSlug != null && item.episodeNumber != null) {
    return `/verticals/watch/${item.seriesSlug}/${item.episodeNumber}${resume}`;
  }
  return "/verticals";
}
