/** Format delivery % without rounding small values to 0. */
export function formatDeliveryPercent(delivered: number, target: number): string {
  if (target <= 0) return "0%"
  const pct = (delivered / target) * 100
  if (delivered > 0 && pct < 0.01) return "<0.01%"
  if (pct < 1) return `${pct.toFixed(2)}%`
  if (pct < 10) return `${pct.toFixed(1)}%`
  return `${Math.round(pct)}%`
}

/** Progress bar width — ensures a visible sliver when delivery > 0. */
export function deliveryProgressValue(delivered: number, target: number): number {
  if (target <= 0 || delivered <= 0) return 0
  const pct = (delivered / target) * 100
  return Math.min(100, Math.max(pct, 2))
}

export function formatCtr(clicks: number, impressions: number): string {
  if (impressions <= 0) return "0.00"
  return ((clicks / impressions) * 100).toFixed(2)
}

export const AD_PLACEMENT_LABELS: Record<string, string> = {
  home_banner: "Home banner",
  shorts_interstitial: "Shorts interstitial",
  movie_preroll: "Movie preroll",
  vertical_episode: "Vertical episode gate",
}

export function placementLabel(placement: string): string {
  return AD_PLACEMENT_LABELS[placement] ?? placement.replace(/_/g, " ")
}
