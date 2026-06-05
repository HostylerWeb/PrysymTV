import type { HistoryItemRecord } from "@/lib/api/types";
import { historyProgressPercent, videoThumbnail } from "@/lib/format-media";

export type SettingsHistoryItem = {
  id: string;
  contentType: "video" | "podcast_episode" | "vertical_episode";
  contentId: string;
  title: string;
  thumbnail: string;
  channel: string;
  progress: number;
  href: string;
};

export function mapHistoryToSettingsItems(
  items: HistoryItemRecord[],
): SettingsHistoryItem[] {
  const mapped: SettingsHistoryItem[] = [];

  for (const item of items) {
    if (item.video) {
      const pct = historyProgressPercent(
        item.progressSeconds,
        item.video.durationSeconds,
      );
      const type = item.video.type ?? "video";
      const href =
        type === "movie"
          ? `/movie/${item.video.id}`
          : type === "short"
            ? "/shorts"
            : `/watch/${item.video.id}`;
      const channel =
        item.video.creator?.displayName ??
        item.video.creator?.username ??
        "Video";
      mapped.push({
        id: `${item.contentType}-${item.contentId}`,
        contentType: item.contentType as SettingsHistoryItem["contentType"],
        contentId: item.contentId,
        title: item.video.title,
        thumbnail: videoThumbnail(item.video.thumbnailUrl),
        channel,
        progress: pct,
        href,
      });
      continue;
    }
    if (item.podcastEpisode) {
      const pct = historyProgressPercent(
        item.progressSeconds,
        item.podcastEpisode.durationSeconds,
      );
      mapped.push({
        id: `${item.contentType}-${item.contentId}`,
        contentType: item.contentType as SettingsHistoryItem["contentType"],
        contentId: item.contentId,
        title: item.podcastEpisode.title,
        thumbnail: videoThumbnail(item.podcastEpisode.coverUrl),
        channel: item.podcastEpisode.show?.title ?? "Podcast",
        progress: pct,
        href: `/podcast/${item.podcastEpisode.id}`,
      });
      continue;
    }
    if (item.verticalEpisode) {
      const ep = item.verticalEpisode;
      const pct = historyProgressPercent(
        item.progressSeconds,
        ep.durationSeconds,
      );
      mapped.push({
        id: `${item.contentType}-${item.contentId}`,
        contentType: item.contentType as SettingsHistoryItem["contentType"],
        contentId: item.contentId,
        title: ep.title,
        thumbnail: videoThumbnail(ep.thumbnailUrl ?? ep.series.posterUrl),
        channel: `${ep.series.title} · Ep ${ep.episodeNumber}`,
        progress: pct,
        href: `/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`,
      });
    }
  }

  return mapped;
}
