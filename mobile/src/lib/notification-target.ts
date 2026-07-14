export type NotificationMetadata = {
  dedupeKey?: string;
  videoType?: string;
  videoId?: string;
  commentId?: string;
  contentType?: 'video' | 'vertical_episode' | 'podcast_episode';
  seriesSlug?: string;
  episodeNumber?: number;
  podcastEpisodeId?: string;
  processingPhase?: 'started' | 'complete' | 'failed';
  contentLabel?: string;
};

function verticalEpisodeRoute(
  seriesSlug?: string,
  episodeNumber?: number,
): string | undefined {
  if (!seriesSlug || episodeNumber == null) return undefined;
  return `/verticals/watch/${seriesSlug}/${episodeNumber}`;
}

function podcastEpisodeRoute(podcastEpisodeId?: string): string | undefined {
  if (!podcastEpisodeId) return undefined;
  return `/podcast/${podcastEpisodeId}`;
}

/** Resolves expo-router path for a notification row. */
export function buildNotificationRoute(
  type: string,
  referenceId: string | null,
  metadata?: NotificationMetadata | null,
  actorUsername?: string | null,
): string | undefined {
  const videoId = metadata?.videoId ?? referenceId ?? undefined;
  const videoType = metadata?.videoType;
  const contentType = metadata?.contentType;

  if (contentType === 'vertical_episode') {
    const route = verticalEpisodeRoute(metadata?.seriesSlug, metadata?.episodeNumber);
    if (route) return route;
  }

  if (contentType === 'podcast_episode') {
    const route = podcastEpisodeRoute(metadata?.podcastEpisodeId ?? referenceId ?? undefined);
    if (route) return route;
  }

  switch (type) {
    case 'follow':
      if (!actorUsername) return undefined;
      return `/creator/${actorUsername.replace(/^@/, '')}`;

    case 'like':
    case 'comment': {
      if (contentType === 'vertical_episode') {
        return verticalEpisodeRoute(metadata?.seriesSlug, metadata?.episodeNumber);
      }
      if (!videoId) return undefined;
      if (videoType === 'short') {
        return { pathname: '/(tabs)/shorts', params: { start: videoId } } as unknown as string;
      }
      if (videoType === 'movie') return `/movie/${videoId}`;
      return `/watch/${videoId}`;
    }

    case 'upload': {
      if (contentType === 'vertical_episode') {
        return verticalEpisodeRoute(metadata?.seriesSlug, metadata?.episodeNumber);
      }
      if (!videoId) return undefined;
      if (videoType === 'short') {
        return { pathname: '/(tabs)/shorts', params: { start: videoId } } as unknown as string;
      }
      if (videoType === 'movie') return `/movie/${videoId}`;
      return `/watch/${videoId}`;
    }

    case 'live':
    case 'gift':
      return referenceId ? `/live/${referenceId}` : undefined;

    case 'system': {
      const phase = metadata?.processingPhase;
      if (phase === 'started' || phase === 'failed') {
        return undefined;
      }

      if (contentType === 'vertical_episode') {
        return verticalEpisodeRoute(metadata?.seriesSlug, metadata?.episodeNumber);
      }
      if (contentType === 'podcast_episode') {
        return podcastEpisodeRoute(metadata?.podcastEpisodeId ?? referenceId ?? undefined);
      }
      if (videoId) {
        if (videoType === 'short') {
          return { pathname: '/(tabs)/shorts', params: { start: videoId } } as unknown as string;
        }
        if (videoType === 'movie') return `/movie/${videoId}`;
        return `/watch/${videoId}`;
      }
      return '/profile';
    }

    default:
      return undefined;
  }
}

export type NotificationNavTarget =
  | string
  | { pathname: string; params?: Record<string, string> };

export function resolveNotificationNavTarget(
  type: string,
  referenceId: string | null,
  metadata?: NotificationMetadata | null,
  actorUsername?: string | null,
): NotificationNavTarget | undefined {
  const videoId = metadata?.videoId ?? referenceId ?? undefined;
  const videoType = metadata?.videoType;
  const contentType = metadata?.contentType;

  if (contentType === 'vertical_episode') {
    const route = verticalEpisodeRoute(metadata?.seriesSlug, metadata?.episodeNumber);
    if (route) return route;
  }

  if (contentType === 'podcast_episode') {
    const route = podcastEpisodeRoute(metadata?.podcastEpisodeId ?? referenceId ?? undefined);
    if (route) return route;
  }

  switch (type) {
    case 'follow':
      if (!actorUsername) return undefined;
      return `/creator/${actorUsername.replace(/^@/, '')}`;

    case 'like':
    case 'comment':
    case 'upload': {
      if (contentType === 'vertical_episode') {
        return verticalEpisodeRoute(metadata?.seriesSlug, metadata?.episodeNumber);
      }
      if (!videoId) return undefined;
      if (videoType === 'short') {
        return { pathname: '/(tabs)/shorts', params: { start: videoId } };
      }
      if (videoType === 'movie') return `/movie/${videoId}`;
      return `/watch/${videoId}`;
    }

    case 'live':
    case 'gift':
      return referenceId ? `/live/${referenceId}` : undefined;

    case 'system': {
      const phase = metadata?.processingPhase;
      if (phase === 'started' || phase === 'failed') {
        return undefined;
      }

      if (contentType === 'vertical_episode') {
        return verticalEpisodeRoute(metadata?.seriesSlug, metadata?.episodeNumber);
      }
      if (contentType === 'podcast_episode') {
        return podcastEpisodeRoute(metadata?.podcastEpisodeId ?? referenceId ?? undefined);
      }
      if (videoId) {
        if (videoType === 'short') {
          return { pathname: '/(tabs)/shorts', params: { start: videoId } };
        }
        if (videoType === 'movie') return `/movie/${videoId}`;
        return `/watch/${videoId}`;
      }
      return '/profile';
    }

    default:
      return undefined;
  }
}
