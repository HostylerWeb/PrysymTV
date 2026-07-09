import { getApiBaseUrl } from '@/lib/api/config';

/** Legacy R2 dev URLs → API assets proxy (bucket is private). */
export function proxyMediaAssetUrl(url: string): string {
  const trimmed = url.trim();
  const apiBase = getApiBaseUrl().replace(/\/$/, '');
  const r2Match = trimmed.match(/^https?:\/\/[^/]+\.r2\.dev\/(.+)$/i);
  if (r2Match?.[1]) return `${apiBase}/assets/${r2Match[1]}`;
  if (trimmed.startsWith(`${apiBase}/assets/`)) return trimmed;
  return trimmed;
}

export function withUploadVersion(publicUrl: string): string {
  const base = publicUrl.split('?')[0];
  return `${base}?v=${Date.now()}`;
}

export function resolveProfileMediaUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return proxyMediaAssetUrl(trimmed);
}

export function resolveAvatarUrl(
  avatarUrl: string | null | undefined,
  seed: string,
): string {
  const resolved = resolveProfileMediaUrl(avatarUrl);
  if (resolved) return resolved;
  const safeSeed = encodeURIComponent(seed.replace(/^@/, '').slice(0, 32) || 'user');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${safeSeed}&backgroundColor=6366f1,475569`;
}

export function resolvePlaybackUrl(source: {
  hlsMasterUrl?: string | null;
  playbackUrl?: string | null;
  videoUrl?: string | null;
  hlsPlaybackUrl?: string | null;
  audioUrl?: string | null;
}): string | null {
  const raw =
    source.hlsMasterUrl ??
    source.hlsPlaybackUrl ??
    source.playbackUrl ??
    source.videoUrl ??
    source.audioUrl;
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return proxyMediaAssetUrl(trimmed);
}
