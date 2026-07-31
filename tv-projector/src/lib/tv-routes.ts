import { watchVideoParams } from '@/lib/watch-params';
import type { ContinueWatchingItem, HistoryItemRecord } from '@/types/api';

export function continueWatchingPath(item: ContinueWatchingItem): {
  pathname: string;
  params?: Record<string, string>;
} {
  if (item.contentType === 'video') {
    return {
      pathname: '/watch/[id]',
      params: watchVideoParams({
        id: item.contentId,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
      }),
    };
  }
  if (item.contentType === 'podcast_episode') {
    return { pathname: '/podcast/[id]', params: { id: item.contentId } };
  }
  if (
    item.contentType === 'vertical_episode' &&
    item.seriesSlug &&
    item.episodeNumber != null
  ) {
    return {
      pathname: '/verticals/watch/[slug]/[episode]',
      params: { slug: item.seriesSlug, episode: String(item.episodeNumber) },
    };
  }
  return { pathname: '/(main)' };
}

export function historyItemPath(item: HistoryItemRecord): {
  pathname: string;
  params?: Record<string, string>;
} {
  if (item.contentType === 'video' && item.video) {
    return {
      pathname: '/watch/[id]',
      params: watchVideoParams({
        id: item.video.id,
        title: item.video.title,
        thumbnailUrl: item.video.thumbnailUrl,
      }),
    };
  }
  if (item.contentType === 'podcast_episode' && item.podcastEpisode) {
    return { pathname: '/podcast/[id]', params: { id: item.podcastEpisode.id } };
  }
  if (item.contentType === 'vertical_episode' && item.verticalEpisode) {
    return {
      pathname: '/verticals/watch/[slug]/[episode]',
      params: {
        slug: item.verticalEpisode.series.slug,
        episode: String(item.verticalEpisode.episodeNumber),
      },
    };
  }
  return { pathname: '/(main)' };
}

export function historyItemTitle(item: HistoryItemRecord): string {
  if (item.video) return item.video.title;
  if (item.podcastEpisode) return item.podcastEpisode.title;
  if (item.verticalEpisode) return item.verticalEpisode.title;
  return 'Watch';
}
