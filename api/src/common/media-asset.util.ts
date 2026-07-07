/** Object-key prefixes that may be served via the public assets proxy. */
export const PUBLIC_ASSET_PREFIXES = [
  'uploads/thumbnails/',
  'uploads/movies/',
  'uploads/podcasts/',
  'uploads/stores/',
  'uploads/ads/',
  'uploads/avatars/',
  'uploads/banners/',
] as const;

export function isPublicAssetKey(key: string): boolean {
  const normalized = key.replace(/^\/+/, '');
  return PUBLIC_ASSET_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
