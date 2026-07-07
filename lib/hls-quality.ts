export type HlsQualityLevel = {
  index: number
  height: number
  label: string
}

export type HlsQualityControl = {
  levels: HlsQualityLevel[]
  currentLevel: number
  setLevel: (levelIndex: number) => void
}

export function labelForHeight(height: number): string {
  if (height >= 1080) return "1080p"
  if (height >= 720) return "720p"
  if (height >= 480) return "480p"
  if (height >= 360) return "360p"
  if (height > 0) return `${height}p`
  return "Unknown"
}
