import { proxyMediaAssetUrl } from '@/lib/media-url';

/** Emoji shown when no custom gift image is set. */
export const GIFT_ICON_BY_ID: Record<string, string> = {
  heart: '❤️',
  star: '⭐',
  fire: '🔥',
  diamond: '💎',
  lion: '🦁',
  universe: '🌌',
  rose: '🌹',
  rocket: '🚀',
};

export function isGiftImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/')
  );
}

export function giftIconFor(idOrKey: string | null | undefined): string {
  if (!idOrKey) return '🎁';
  if (isGiftImageUrl(idOrKey)) return proxyMediaAssetUrl(idOrKey);
  return GIFT_ICON_BY_ID[idOrKey] ?? '🎁';
}

export function giftCatalogIcon(gift: {
  imageUrl?: string | null;
  animationKey?: string;
  id?: string;
}): string {
  const url = gift.imageUrl?.trim();
  if (url) return proxyMediaAssetUrl(url);
  return giftIconFor(gift.animationKey || gift.id);
}

export function giftVisualFor(gift: {
  imageUrl?: string | null;
  animationKey?: string;
  id?: string;
}): { type: 'image'; value: string } | { type: 'emoji'; value: string } {
  const icon = giftCatalogIcon(gift);
  if (isGiftImageUrl(icon)) return { type: 'image', value: icon };
  return { type: 'emoji', value: icon };
}
