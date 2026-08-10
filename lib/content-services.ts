export type ContentServiceKey =
  | "videos"
  | "movies"
  | "shorts"
  | "verticals"
  | "podcasts"

export type ContentServicesSettings = Record<ContentServiceKey, boolean>

export const CONTENT_SERVICE_KEYS: ContentServiceKey[] = [
  "videos",
  "movies",
  "shorts",
  "verticals",
  "podcasts",
]

export const CONTENT_SERVICE_LABELS: Record<ContentServiceKey, string> = {
  videos: "Long videos",
  movies: "Movies",
  shorts: "Shorts",
  verticals: "Verticals",
  podcasts: "Podcasts",
}

export const DEFAULT_CONTENT_SERVICES: ContentServicesSettings = {
  videos: true,
  movies: true,
  shorts: true,
  verticals: true,
  podcasts: true,
}

export function resolveContentServices(
  services?: Partial<ContentServicesSettings> | null,
): ContentServicesSettings {
  return { ...DEFAULT_CONTENT_SERVICES, ...services }
}

export function isContentServiceEnabled(
  services: ContentServicesSettings | undefined | null,
  service: ContentServiceKey,
): boolean {
  return resolveContentServices(services)[service]
}
