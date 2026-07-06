/** Scoped search contexts — each browse page searches only its content type. */
export type SearchScope = "short" | "video" | "vertical" | "podcast" | "movie"

export type SearchScopeConfig = {
  apiType: SearchScope
  placeholder: string
  emptyHint: string
  resultsLabel: string
}

export const SEARCH_SCOPE_CONFIG: Record<SearchScope, SearchScopeConfig> = {
  short: {
    apiType: "short",
    placeholder: "Search shorts…",
    emptyHint: "Find short-form vertical videos from creators.",
    resultsLabel: "Shorts",
  },
  video: {
    apiType: "video",
    placeholder: "Search long-form videos…",
    emptyHint: "Find creator videos — not movies or shorts.",
    resultsLabel: "Videos",
  },
  vertical: {
    apiType: "vertical",
    placeholder: "Search vertical series…",
    emptyHint: "Find micro-drama series and pocket episodes.",
    resultsLabel: "Verticals",
  },
  podcast: {
    apiType: "podcast",
    placeholder: "Search podcasts…",
    emptyHint: "Find podcast shows and episodes.",
    resultsLabel: "Podcasts",
  },
  movie: {
    apiType: "movie",
    placeholder: "Search movies…",
    emptyHint: "Find feature films and theatrical releases.",
    resultsLabel: "Movies",
  },
}

export function isSearchScope(value: string | null | undefined): value is SearchScope {
  return (
    value === "short" ||
    value === "video" ||
    value === "vertical" ||
    value === "podcast" ||
    value === "movie"
  )
}
