import type { NotificationType, VideoType } from '@prisma/client';

export type NotificationMetadata = {
  dedupeKey?: string;
  videoType?: VideoType | string;
  videoId?: string;
  commentId?: string;
  contentType?: 'video' | 'vertical_episode' | 'podcast_episode';
  seriesSlug?: string;
  episodeNumber?: number;
  podcastEpisodeId?: string;
};

function commentQuery(commentId?: string, openComments = false): string {
  const params = new URLSearchParams();
  if (openComments || commentId) params.set('comments', '1');
  if (commentId) params.set('comment', commentId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function verticalEpisodeUrl(
  seriesSlug?: string,
  episodeNumber?: number,
  commentId?: string,
  openComments = false,
): string | undefined {
  if (!seriesSlug || episodeNumber == null) return undefined;
  return `/verticals/watch/${seriesSlug}/${episodeNumber}${commentQuery(commentId, openComments)}`;
}

function podcastEpisodeUrl(podcastEpisodeId?: string): string | undefined {
  if (!podcastEpisodeId) return undefined;
  return `/podcast/${podcastEpisodeId}`;
}

export function buildNotificationActionUrl(
  type: NotificationType | string,
  referenceId: string | null | undefined,
  metadata?: NotificationMetadata | null,
  actorUsername?: string | null,
): string {
  const videoId = metadata?.videoId ?? referenceId ?? undefined;
  const videoType = metadata?.videoType;
  const commentId = metadata?.commentId;
  const contentType = metadata?.contentType;

  if (contentType === 'vertical_episode') {
    const url = verticalEpisodeUrl(
      metadata?.seriesSlug,
      metadata?.episodeNumber,
      commentId,
      type === 'comment',
    );
    if (url) return url;
  }

  if (contentType === 'podcast_episode') {
    const url = podcastEpisodeUrl(
      metadata?.podcastEpisodeId ?? referenceId ?? undefined,
    );
    if (url) return url;
  }

  switch (type) {
    case 'follow':
      if (!actorUsername) return '/';
      return `/creator/${actorUsername.replace(/^@/, '')}`;

    case 'like':
    case 'comment': {
      if (contentType === 'vertical_episode') {
        return (
          verticalEpisodeUrl(
            metadata?.seriesSlug,
            metadata?.episodeNumber,
            commentId,
            type === 'comment',
          ) ?? '/'
        );
      }
      if (!videoId) return '/';
      if (videoType === 'short') {
        const params = new URLSearchParams({ start: videoId });
        if (commentId || type === 'comment') {
          params.set('comments', '1');
          if (commentId) params.set('comment', commentId);
        }
        return `/shorts?${params}`;
      }
      if (videoType === 'movie') return `/movie/${videoId}`;
      return `/watch/${videoId}${commentQuery(commentId, type === 'comment')}`;
    }

    case 'upload': {
      if (contentType === 'vertical_episode') {
        return (
          verticalEpisodeUrl(metadata?.seriesSlug, metadata?.episodeNumber) ??
          '/'
        );
      }
      if (!videoId) return '/';
      if (videoType === 'short') {
        return `/shorts?start=${encodeURIComponent(videoId)}`;
      }
      if (videoType === 'movie') return `/movie/${videoId}`;
      return `/watch/${videoId}`;
    }

    case 'live':
    case 'gift':
      return referenceId ? `/live/${referenceId}` : '/';

    default:
      return '/';
  }
}
