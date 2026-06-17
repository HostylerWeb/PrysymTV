import { userAvatarUrl } from "@/lib/user-avatar";

const DEFAULT_PLACEHOLDER_THUMB = "/placeholder.svg";

function placeholderThumb(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MEDIA_PLACEHOLDER_URL?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_PLACEHOLDER_THUMB;
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
  return placeholderThumb();
}

/** Poster for live cards: saved thumb → creator avatar → placeholder. */
export function liveStreamPosterUrl(item: {
  thumbnailUrl?: string | null;
  streamerAvatar?: string | null;
  streamerSlug?: string | null;
  streamer?: string | null;
}): string {
  const thumb = item.thumbnailUrl?.trim();
  if (thumb) return thumb;
  const seed = item.streamerSlug ?? item.streamer ?? "live";
  return userAvatarUrl(item.streamerAvatar, seed);
}

export function historyProgressPercent(
  progressSeconds: number,
  durationSeconds: number,
): number {
  if (!durationSeconds) return 0;
  return Math.min(100, Math.round((progressSeconds / durationSeconds) * 100));
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/** YouTube / TikTok style relative timestamps for comments and activity. */
export function formatRelativeTime(isoOrDate: string | Date, nowMs = Date.now()): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const ts = date.getTime();
  if (Number.isNaN(ts)) return "";

  let diffSec = Math.floor((nowMs - ts) / 1000);
  if (diffSec < 0) diffSec = 0;

  if (diffSec < 60) return "Just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return diffMin === 1 ? "1 min ago" : `${diffMin} mins ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return pluralize(diffHour, "1 hour ago", `${diffHour} hours ago`);
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return pluralize(diffDay, "1 day ago", `${diffDay} days ago`);
  }

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) {
    return pluralize(diffWeek, "1 week ago", `${diffWeek} weeks ago`);
  }

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) {
    return pluralize(diffMonth, "1 month ago", `${diffMonth} months ago`);
  }

  const diffYear = Math.floor(diffDay / 365);
  return pluralize(diffYear, "1 year ago", `${diffYear} years ago`);
}

export function savedItemLabel(itemType: string): string {
  switch (itemType) {
    case "movie":
      return "Movie";
    case "live":
      return "Live";
    case "podcast_episode":
      return "Podcast";
    case "vertical_episode":
      return "Vertical";
    case "vertical_series":
      return "Series";
    case "playlist":
      return "Playlist";
    default:
      return "Video";
  }
}
