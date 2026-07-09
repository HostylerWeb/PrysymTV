import { mediaThumb } from '@/lib/api/map-content';
import type {
  ContinueWatchingItem,
  HistoryItemRecord,
  LikedItemRecord,
  SavedItemRecord,
  VideoCard,
  VideoRecord,
} from '@/types/api';
import { mapVideoCard } from '@/lib/api/map-content';

export type ProfileItemCard = {
  key: string;
  route: string | { pathname: string; params?: Record<string, string> };
  title: string;
  thumbnailUrl: string | null;
  label: string;
};

function videoRoute(video: { id: string; type?: string | null }): string | { pathname: string; params: Record<string, string> } {
  const type = video.type ?? 'video';
  if (type === 'movie') return `/movie/${video.id}`;
  if (type === 'short') return { pathname: '/(tabs)/shorts', params: { start: video.id } };
  return `/watch/${video.id}`;
}

function savedItemLabel(itemType: string): string {
  if (itemType === 'podcast_episode') return 'Podcast';
  if (itemType === 'vertical_episode') return 'Vertical';
  if (itemType === 'vertical_series') return 'Series';
  return 'Video';
}

export function mapSavedItemCard(item: SavedItemRecord): ProfileItemCard | null {
  if (item.video) {
    return {
      key: `${item.itemType}-${item.itemId}`,
      route: videoRoute(item.video),
      title: item.video.title,
      thumbnailUrl: mediaThumb(item.video.thumbnailUrl),
      label: savedItemLabel(item.itemType),
    };
  }
  if (item.podcastEpisode) {
    const ep = item.podcastEpisode;
    return {
      key: `${item.itemType}-${item.itemId}`,
      route: `/podcast/${ep.id}`,
      title: ep.title,
      thumbnailUrl: mediaThumb(ep.coverUrl),
      label: savedItemLabel(item.itemType),
    };
  }
  if (item.verticalEpisode) {
    const ep = item.verticalEpisode;
    return {
      key: `${item.itemType}-${item.itemId}`,
      route: `/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`,
      title: ep.title,
      thumbnailUrl: mediaThumb(ep.thumbnailUrl ?? ep.series.posterUrl),
      label: `${ep.series.title} · Ep ${ep.episodeNumber}`,
    };
  }
  if (item.verticalSeries) {
    const series = item.verticalSeries;
    return {
      key: `${item.itemType}-${item.itemId}`,
      route: `/verticals/${series.slug}`,
      title: series.title,
      thumbnailUrl: mediaThumb(series.posterUrl),
      label: 'Series',
    };
  }
  return null;
}

export function mapLikedItemCard(item: LikedItemRecord): ProfileItemCard | null {
  if (item.video) {
    return {
      key: `${item.targetType}-${item.targetId}`,
      route: videoRoute(item.video),
      title: item.video.title,
      thumbnailUrl: mediaThumb(item.video.thumbnailUrl),
      label: item.targetType === 'video' ? 'Video' : savedItemLabel(item.targetType),
    };
  }
  if (item.podcastEpisode) {
    const ep = item.podcastEpisode;
    return {
      key: `${item.targetType}-${item.targetId}`,
      route: `/podcast/${ep.id}`,
      title: ep.title,
      thumbnailUrl: mediaThumb(ep.coverUrl),
      label: 'Podcast',
    };
  }
  if (item.verticalEpisode) {
    const ep = item.verticalEpisode;
    return {
      key: `${item.targetType}-${item.targetId}`,
      route: `/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`,
      title: ep.title,
      thumbnailUrl: mediaThumb(ep.thumbnailUrl ?? ep.series.posterUrl),
      label: `${ep.series.title} · Ep ${ep.episodeNumber}`,
    };
  }
  return null;
}

export function videoRecordToCard(video: VideoRecord): VideoCard {
  return mapVideoCard({
    id: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    durationSeconds: video.durationSeconds,
    type: video.type,
    channel: video.creator?.displayName ?? 'You',
    channelSlug: video.creator?.username ?? 'me',
    viewsCount: video.viewsCount,
  });
}

export function mapHistoryToContinueWatching(item: HistoryItemRecord): ContinueWatchingItem | null {
  if (item.verticalEpisode) {
    const ep = item.verticalEpisode;
    return {
      contentType: 'vertical_episode',
      contentId: ep.id,
      title: ep.title,
      thumbnailUrl: mediaThumb(ep.thumbnailUrl ?? ep.series.posterUrl),
      progressSeconds: item.progressSeconds,
      durationSeconds: ep.durationSeconds ?? 0,
      seriesSlug: ep.series.slug,
      subtitle: ep.series.title,
      episodeNumber: ep.episodeNumber,
    };
  }
  if (item.video) {
    return {
      contentType: 'video',
      contentId: item.video.id,
      title: item.video.title,
      thumbnailUrl: mediaThumb(item.video.thumbnailUrl),
      progressSeconds: item.progressSeconds,
      durationSeconds: item.video.durationSeconds ?? 0,
    };
  }
  return null;
}

export type HistoryListItem = {
  key: string;
  title: string;
  subtitle: string;
  route: string | { pathname: string; params?: Record<string, string> };
  contentType: 'video' | 'podcast_episode' | 'vertical_episode';
  contentId: string;
};

export function mapHistoryListItem(item: HistoryItemRecord): HistoryListItem | null {
  if (item.video) {
    return {
      key: `video-${item.video.id}`,
      title: item.video.title,
      subtitle: 'Video',
      route: videoRoute(item.video),
      contentType: 'video',
      contentId: item.video.id,
    };
  }
  if (item.podcastEpisode) {
    const ep = item.podcastEpisode;
    return {
      key: `podcast-${ep.id}`,
      title: ep.title,
      subtitle: ep.show?.title ?? 'Podcast',
      route: `/podcast/${ep.id}`,
      contentType: 'podcast_episode',
      contentId: ep.id,
    };
  }
  if (item.verticalEpisode) {
    const ep = item.verticalEpisode;
    return {
      key: `vertical-${ep.id}`,
      title: ep.title,
      subtitle: ep.series.title,
      route: `/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`,
      contentType: 'vertical_episode',
      contentId: ep.id,
    };
  }
  return null;
}
