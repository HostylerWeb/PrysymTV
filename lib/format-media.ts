function placeholderThumb(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MEDIA_PLACEHOLDER_URL?.trim();
  if (fromEnv) return fromEnv;
  return "";
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    const v = count / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (count >= 1_000) {
    const v = count / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return String(count);
}

export function videoThumbnail(url: string | null | undefined): string {
  const trimmed = url?.trim();
  if (trimmed) return trimmed;
  const fallback = placeholderThumb();
  return fallback || trimmed || "";
}

export function historyProgressPercent(
  progressSeconds: number,
  durationSeconds: number,
): number {
  if (!durationSeconds) return 0;
  return Math.min(100, Math.round((progressSeconds / durationSeconds) * 100));
}

export function savedItemLabel(itemType: string): string {
  switch (itemType) {
    case "movie":
      return "Movie";
    case "live":
      return "Live";
    case "podcast_episode":
      return "Podcast";
    case "playlist":
      return "Playlist";
    default:
      return "Video";
  }
}
