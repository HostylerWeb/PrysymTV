/** Emoji shown in live chat for each gift catalog id / animation key. */
export const GIFT_ICON_BY_ID: Record<string, string> = {
  heart: "❤️",
  star: "⭐",
  fire: "🔥",
  diamond: "💎",
  lion: "🦁",
  universe: "🌌",
}

export function isGiftImageUrl(value: string | null | undefined): boolean {
  if (!value) return false
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  )
}

export function giftIconFor(idOrKey: string | null | undefined): string {
  if (!idOrKey) return "🎁"
  if (isGiftImageUrl(idOrKey)) return idOrKey
  return GIFT_ICON_BY_ID[idOrKey] ?? "🎁"
}

export function giftCatalogIcon(gift: {
  imageUrl?: string | null
  animationKey?: string
  id?: string
}): string {
  const url = gift.imageUrl?.trim()
  if (url) return url
  return giftIconFor(gift.animationKey || gift.id)
}
