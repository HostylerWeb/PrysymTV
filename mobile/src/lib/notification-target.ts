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

/** Converts web-style notification action URLs to expo-router targets. */
export function parseNotificationActionUrl(url: string): NotificationNavTarget | undefined {
  if (!url || url === '/') return undefined;

  try {
    const parsed = new URL(url, 'https://prysym.tv');
    const pathname = parsed.pathname;
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (pathname === '/shorts') {
      const start = params.start;
      if (!start) return '/(tabs)/shorts';
      const { start: _start, ...rest } = params;
      return Object.keys(rest).length
        ? { pathname: '/(tabs)/shorts', params: { start, ...rest } }
        : { pathname: '/(tabs)/shorts', params: { start } };
    }

    if (pathname.startsWith('/watch/')) {
      const id = pathname.slice('/watch/'.length);
      if (!id) return undefined;
      return `/watch/${id}${parsed.search}`;
    }

    if (pathname.startsWith('/movie/')) {
      const id = pathname.slice('/movie/'.length);
      return id ? `/movie/${id}` : undefined;
    }

    if (pathname.startsWith('/creator/')) {
      const username = pathname.slice('/creator/'.length);
      return username ? `/creator/${username}` : undefined;
    }

    if (pathname.startsWith('/live/')) {
      const id = pathname.slice('/live/'.length);
      return id ? `/live/${id}` : undefined;
    }

    if (pathname.startsWith('/verticals/watch/')) {
      return `${pathname}${parsed.search}`;
    }

    if (pathname.startsWith('/podcast/')) {
      const id = pathname.slice('/podcast/'.length);
      return id ? `/podcast/${id}` : undefined;
    }

    if (pathname === '/profile') return '/profile';

    if (pathname.startsWith('/')) return `${pathname}${parsed.search}`;
    return undefined;
  } catch {
    if (url.startsWith('/')) return url;
    return undefined;
  }
}

export type PushNotificationData = {
  url?: string;
  tag?: string;
  type?: string;
  referenceId?: string | null;
  metadata?: NotificationMetadata | null;
  actorUsername?: string | null;
  navTarget?: NotificationNavTarget;
};

export function resolveNotificationNavTargetFromPushData(
  data: PushNotificationData | null | undefined,
): NotificationNavTarget | undefined {
  if (!data) return undefined;

  const normalized: PushNotificationData = { ...data };
  if (typeof normalized.metadata === 'string') {
    try {
      normalized.metadata = JSON.parse(normalized.metadata) as NotificationMetadata;
    } catch {
      normalized.metadata = null;
    }
  }

  if (normalized.navTarget) {
    return normalized.navTarget;
  }

  if (normalized.type) {
    const resolved = resolveNotificationNavTarget(
      normalized.type,
      normalized.referenceId ?? null,
      normalized.metadata ?? null,
      normalized.actorUsername ?? null,
    );
    if (resolved) return resolved;
  }

  if (typeof normalized.url === 'string' && normalized.url.trim()) {
    return parseNotificationActionUrl(normalized.url.trim());
  }

  return undefined;
}
