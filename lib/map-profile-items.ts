import type { LikedItemRecord, SavedItemRecord } from "@/lib/api/types";
import { savedItemLabel, videoThumbnail } from "@/lib/format-media";

export type ProfileItemCard = {
  key: string;
  href: string;
  title: string;
  thumbnail: string;
  label: string;
};

function videoHref(video: { id: string; type?: string | null }): string {
  const type = video.type ?? "video";
  if (type === "movie") return `/movie/${video.id}`;
  if (type === "short") return `/watch/${video.id}`;
  return `/watch/${video.id}`;
}

export function mapSavedItemCard(item: SavedItemRecord): ProfileItemCard | null {
  if (item.video) {
    return {
      key: `${item.itemType}-${item.itemId}`,
      href: videoHref(item.video),
      title: item.video.title,
      thumbnail: videoThumbnail(item.video.thumbnailUrl),
      label: savedItemLabel(item.itemType),
    };
  }
  if (item.podcastEpisode) {
    const ep = item.podcastEpisode;
    return {
      key: `${item.itemType}-${item.itemId}`,
      href: `/podcast/${ep.id}`,
      title: ep.title,
      thumbnail: videoThumbnail(ep.coverUrl),
      label: savedItemLabel(item.itemType),
    };
  }
  if (item.verticalEpisode) {
    const ep = item.verticalEpisode;
    return {
      key: `${item.itemType}-${item.itemId}`,
      href: `/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`,
      title: ep.title,
      thumbnail: videoThumbnail(ep.thumbnailUrl ?? ep.series.posterUrl),
      label: `${ep.series.title} · Ep ${ep.episodeNumber}`,
    };
  }
  if (item.verticalSeries) {
    const series = item.verticalSeries;
    return {
      key: `${item.itemType}-${item.itemId}`,
      href: `/verticals/${series.slug}`,
      title: series.title,
      thumbnail: videoThumbnail(series.posterUrl),
      label: "Series",
    };
  }
  return null;
}

export function mapLikedItemCard(item: LikedItemRecord): ProfileItemCard | null {
  if (item.video) {
    return {
      key: `${item.targetType}-${item.targetId}`,
      href: videoHref(item.video),
      title: item.video.title,
      thumbnail: videoThumbnail(item.video.thumbnailUrl),
      label: item.targetType === "video" ? "Video" : savedItemLabel(item.targetType),
    };
  }
  if (item.podcastEpisode) {
    const ep = item.podcastEpisode;
    return {
      key: `${item.targetType}-${item.targetId}`,
      href: `/podcast/${ep.id}`,
      title: ep.title,
      thumbnail: videoThumbnail(ep.coverUrl),
      label: "Podcast",
    };
  }
  if (item.verticalEpisode) {
    const ep = item.verticalEpisode;
    return {
      key: `${item.targetType}-${item.targetId}`,
      href: `/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`,
      title: ep.title,
      thumbnail: videoThumbnail(ep.thumbnailUrl ?? ep.series.posterUrl),
      label: `${ep.series.title} · Ep ${ep.episodeNumber}`,
    };
  }
  return null;
}
