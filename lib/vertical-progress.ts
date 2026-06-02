const STORAGE_KEY = "prysym_vertical_progress"

export type VerticalProgressEntry = {
  slug: string
  seriesTitle: string
  posterUrl: string | null
  episodeNumber: number
  episodeTitle: string
  progressSeconds: number
  durationSeconds: number
  updatedAt: string
}

function readAll(): VerticalProgressEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as VerticalProgressEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(entries: VerticalProgressEntry[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 12)))
}

export function saveVerticalProgress(entry: Omit<VerticalProgressEntry, "updatedAt">) {
  const all = readAll().filter(
    (e) => !(e.slug === entry.slug && e.episodeNumber === entry.episodeNumber),
  )
  all.unshift({ ...entry, updatedAt: new Date().toISOString() })
  writeAll(all)
}

export function getVerticalProgressForSeries(slug: string): VerticalProgressEntry | null {
  return readAll().find((e) => e.slug === slug) ?? null
}

export function listVerticalContinueWatching(): VerticalProgressEntry[] {
  return readAll()
}
