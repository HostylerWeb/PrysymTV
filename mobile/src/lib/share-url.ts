import { getWsUrl } from '@/lib/api/config';

/** Public web origin (same host as the API, without /api/v1). */
export function getWebOrigin(): string {
  return getWsUrl().replace(/\/$/, '');
}

export function buildShareUrl(path: string): string {
  const origin = getWebOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function buildCreatorShareUrl(username: string): string {
  const clean = username.replace(/^@/, '').trim();
  return buildShareUrl(`/creator/${encodeURIComponent(clean)}`);
}
