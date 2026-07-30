import { proxyMediaAssetUrl } from '@/lib/media-url';

export function resolveAdMediaUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return proxyMediaAssetUrl(trimmed);
}
