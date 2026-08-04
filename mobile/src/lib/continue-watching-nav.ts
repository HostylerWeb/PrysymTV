import type { ContinueWatchingItem } from '@/types/api';

/** Build a watch URL that resumes near the user's last position (5s threshold). */
export function continueWatchingHref(item: ContinueWatchingItem): string {
  const t = Math.max(0, Math.floor(item.progressSeconds));
  const resume = t >= 5 ? `?t=${t}` : '';

  if (item.contentType === 'video') return `/watch/${item.contentId}${resume}`;
  if (item.contentType === 'podcast_episode') return `/podcast/${item.contentId}${resume}`;
  if (item.contentType === 'vertical_episode' && item.seriesSlug) {
    return `/verticals/watch/${item.seriesSlug}/${item.episodeNumber ?? 1}${resume}`;
  }
  return '/';
}

export function parseResumeSeconds(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
