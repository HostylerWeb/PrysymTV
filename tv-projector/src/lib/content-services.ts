export type ContentServiceKey =
  | 'videos'
  | 'movies'
  | 'shorts'
  | 'verticals'
  | 'podcasts';

export type ContentServicesSettings = Record<ContentServiceKey, boolean>;

export const CONTENT_SERVICE_KEYS: ContentServiceKey[] = [
  'videos',
  'movies',
  'shorts',
  'verticals',
  'podcasts',
];

export const DEFAULT_CONTENT_SERVICES: ContentServicesSettings = {
  videos: true,
  movies: true,
  shorts: true,
  verticals: true,
  podcasts: true,
};

export function resolveContentServices(
  services?: Partial<ContentServicesSettings> | null,
): ContentServicesSettings {
  return { ...DEFAULT_CONTENT_SERVICES, ...services };
}

export function isContentServiceEnabled(
  services: ContentServicesSettings | undefined | null,
  service: ContentServiceKey,
): boolean {
  return resolveContentServices(services)[service];
}

export function videoTypeToService(
  type: string | undefined | null,
): ContentServiceKey {
  switch (type) {
    case 'movie':
      return 'movies';
    case 'short':
      return 'shorts';
    case 'series_episode':
      return 'verticals';
    default:
      return 'videos';
  }
}

export function isVideoTypeEnabled(
  services: ContentServicesSettings,
  type: string | undefined | null,
): boolean {
  return isContentServiceEnabled(services, videoTypeToService(type));
}

export function filterVideosByService<T extends { type?: string | null }>(
  items: T[],
  services: ContentServicesSettings,
): T[] {
  return items.filter((item) => isVideoTypeEnabled(services, item.type));
}

export type ContinueWatchingLike = {
  contentType?: string;
  videoType?: string | null;
};

export function continueWatchingItemService(
  item: ContinueWatchingLike,
): ContentServiceKey | null {
  if (item.contentType === 'vertical_episode') return 'verticals';
  if (item.contentType === 'podcast_episode') return 'podcasts';
  if (item.contentType === 'video') return videoTypeToService(item.videoType);
  return null;
}

export function isContinueWatchingItemEnabled(
  services: ContentServicesSettings,
  item: ContinueWatchingLike,
): boolean {
  const service = continueWatchingItemService(item);
  return service ? isContentServiceEnabled(services, service) : false;
}

export type HistoryItemLike = {
  verticalEpisode?: unknown;
  podcastEpisode?: unknown;
  video?: { type?: string | null } | null;
};

export function historyItemService(item: HistoryItemLike): ContentServiceKey | null {
  if (item.verticalEpisode) return 'verticals';
  if (item.podcastEpisode) return 'podcasts';
  if (item.video) return videoTypeToService(item.video.type);
  return null;
}

export function isHistoryItemEnabled(
  services: ContentServicesSettings,
  item: HistoryItemLike,
): boolean {
  const service = historyItemService(item);
  return service ? isContentServiceEnabled(services, service) : false;
}
