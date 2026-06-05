import { formatViewCount } from "@/lib/format-media"

/** Parse display strings like "1.2M", "45.2K", "0" into integers. */
export function parseEngagementCount(label: string): number {
  const t = label.trim().toUpperCase().replace(/,/g, "")
  if (!t || t === "0") return 0
  if (t.endsWith("M")) {
    const n = parseFloat(t.slice(0, -1))
    return Number.isFinite(n) ? Math.round(n * 1_000_000) : 0
  }
  if (t.endsWith("K")) {
    const n = parseFloat(t.slice(0, -1))
    return Number.isFinite(n) ? Math.round(n * 1_000) : 0
  }
  const n = parseInt(t, 10)
  return Number.isFinite(n) ? n : 0
}

export function formatEngagementCount(count: number): string {
  if (count <= 0) return "0"
  return formatViewCount(count)
}

export type EngagementCounts = {
  likes: number
  comments: number
  saves: number
  shares: number
}

export function engagementFromShort(short: {
  likes: string
  comments: string
  saves: string
  shares: string
}): EngagementCounts {
  return {
    likes: parseEngagementCount(short.likes),
    comments: parseEngagementCount(short.comments),
    saves: parseEngagementCount(short.saves),
    shares: parseEngagementCount(short.shares),
  }
}

export function adjustEngagement(
  prev: EngagementCounts,
  field: keyof EngagementCounts,
  delta: number,
): EngagementCounts {
  return {
    ...prev,
    [field]: Math.max(0, prev[field] + delta),
  }
}

/** Update a like counter after a successful toggle API call. */
export function bumpLikeCount(
  count: number,
  wasLiked: boolean,
  nowLiked: boolean,
): number {
  if (wasLiked === nowLiked) return count
  return Math.max(0, count + (nowLiked ? 1 : -1))
}
