/** Emoji shown in live chat for each gift catalog id / animation key. */
export const GIFT_ICON_BY_ID: Record<string, string> = {
  heart: "❤️",
  star: "⭐",
  fire: "🔥",
  diamond: "💎",
  lion: "🦁",
  universe: "🌌",
}

export function giftIconFor(idOrKey: string | null | undefined): string {
  if (!idOrKey) return "🎁"
  return GIFT_ICON_BY_ID[idOrKey] ?? "🎁"
}
