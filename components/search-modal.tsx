"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, X, TrendingUp, Clock, ArrowUpRight, Loader2, Users, Radio, Film, Headphones } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  searchApi,
  searchSuggest,
  hrefForSearchVideo,
  type SearchResponse,
  type SearchSuggestion,
} from "@/lib/api/search"
import { formatViewCount, videoThumbnail } from "@/lib/format-media"
import { userAvatarUrl } from "@/lib/user-avatar"
import {
  loadRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from "@/lib/search-recent"
import {
  SEARCH_SCOPE_CONFIG,
  type SearchScope,
} from "@/lib/search-scope"
import { useDefaultSearchSuggestions } from "@/lib/hooks/use-default-search-suggestions"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  /** When set, search is limited to this content type only. */
  scope?: SearchScope
}

const quickCategories = [
  { label: "Movies", color: "bg-blue-500/20 text-blue-400", type: "video" as const },
  { label: "Live", color: "bg-red-500/20 text-red-400", type: "stream" as const },
  { label: "Podcasts", color: "bg-purple-500/20 text-purple-400", type: "podcast" as const },
  { label: "Creators", color: "bg-green-500/20 text-green-400", type: "creator" as const },
]

export function SearchModal({ isOpen, onClose, scope }: SearchModalProps) {
  const router = useRouter()
  const scopeConfig = scope ? SEARCH_SCOPE_CONFIG[scope] : null
  const apiType = scopeConfig?.apiType
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const defaultSuggestionsQuery = useDefaultSearchSuggestions(isOpen && !scope)
  const defaultSuggestions = defaultSuggestionsQuery.data
  const defaultSuggestionsLoading = defaultSuggestionsQuery.isLoading

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(loadRecentSearches())
      if (inputRef.current) inputRef.current.focus()
    } else {
      setSearchQuery("")
      setResults(null)
      setSuggestions([])
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const runSearch = useCallback(
    async (query: string, typeOverride?: string) => {
      const q = query.trim()
      if (!q) {
        setResults(null)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await searchApi(q, typeOverride ?? apiType)
        setResults(data)
        saveRecentSearch(q)
        setRecentSearches(loadRecentSearches())
      } catch {
        setError("Search is unavailable. Check that the API is running.")
        setResults(null)
      } finally {
        setLoading(false)
      }
    },
    [apiType],
  )

  useEffect(() => {
    if (!isOpen) return
    const q = searchQuery.trim()
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!q) {
      setSuggestions([])
      setResults(null)
      setError(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      void searchSuggest(q, apiType)
        .then((res) => setSuggestions(res.suggestions))
        .catch(() => setSuggestions([]))
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, isOpen, apiType])

  const navigateTo = (href: string, query?: string) => {
    if (query?.trim()) saveRecentSearch(query.trim())
    onClose()
    router.push(href)
  }

  const handleSubmitSearch = (query: string, type?: string) => {
    setSearchQuery(query)
    void runSearch(query, scope ? apiType : type)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setResults(null)
    setSuggestions([])
    inputRef.current?.focus()
  }

  const hasResults =
    results &&
    (results.videos.length > 0 ||
      results.creators.length > 0 ||
      results.podcasts.length > 0 ||
      results.streams.length > 0 ||
      (results.verticals?.length ?? 0) > 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="w-full h-full md:h-auto md:max-h-[85vh] md:w-[600px] bg-background md:rounded-3xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 shadow-2xl overflow-hidden">
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
            <form
              className="flex-1 relative"
              onSubmit={(e) => {
                e.preventDefault()
                void runSearch(searchQuery, apiType)
              }}
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-muted-foreground" />
              </div>
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={scopeConfig?.placeholder ?? "Search videos, movies, channels..."}
                className="w-full bg-secondary/50 rounded-full pl-11 pr-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
            <div className="px-4 py-4">
              {!searchQuery.trim() && (
                <>
                  {!scope && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Quick Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {quickCategories.map((category) => (
                          <button
                            key={category.label}
                            type="button"
                            onClick={() => handleSubmitSearch(category.label, category.type)}
                            className={cn(
                              "px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95",
                              category.color,
                            )}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {scopeConfig && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        Search {scopeConfig.resultsLabel}
                      </h3>
                      <p className="text-sm text-muted-foreground">{scopeConfig.emptyHint}</p>
                    </div>
                  )}

                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">Recent Searches</h3>
                        <button
                          type="button"
                          onClick={() => {
                            clearRecentSearches()
                            setRecentSearches([])
                          }}
                          className="text-xs text-primary font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search) => (
                          <button
                            key={search}
                            type="button"
                            onClick={() => handleSubmitSearch(search)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 transition-colors"
                          >
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span className="flex-1 text-left text-sm text-foreground">{search}</span>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!scope && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Try searching
                      </h3>
                      {defaultSuggestionsQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading suggestions…
                        </div>
                      ) : (defaultSuggestionsQuery.data?.length ?? 0) > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {defaultSuggestionsQuery.data!.map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => handleSubmitSearch(label)}
                              className="px-4 py-2 rounded-full text-sm font-medium bg-secondary/60 text-foreground transition-transform active:scale-95"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Find videos, movies, live streams, podcasts, and creators.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {searchQuery.trim() && !results && !loading && suggestions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Suggestions</h3>
                  <div className="space-y-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.href}-${i}`}
                        type="button"
                        onClick={() => navigateTo(s.href, searchQuery)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 text-left"
                      >
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground flex-1 truncate">{s.label}</span>
                        <span className="text-xs text-muted-foreground capitalize">{s.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Searching…</span>
                </div>
              )}

              {error && <p className="text-center text-sm text-destructive py-8">{error}</p>}

              {results && !loading && (
                <div className="space-y-6">
                  {!hasResults && (
                    <p className="text-center text-muted-foreground py-12 text-sm">
                      No results for &quot;{results.query}&quot;
                    </p>
                  )}

                  {!scope && results.streams.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-red-400" /> Live
                      </h3>
                      <div className="space-y-1">
                        {results.streams.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => navigateTo(`/live/${s.id}`, results.query)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 text-left"
                          >
                            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                              LIVE
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.creator.displayName ?? s.creator.username}
                                {s.category ? ` · ${s.category}` : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {results.videos.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Film className="w-4 h-4 text-blue-400" />{" "}
                        {scope === "short"
                          ? "Shorts"
                          : scope === "movie"
                            ? "Movies"
                            : scopeConfig?.resultsLabel ?? "Videos"}
                      </h3>
                      <div className="space-y-1">
                        {results.videos.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => navigateTo(hrefForSearchVideo(v), results.query)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 text-left"
                          >
                            <img
                              src={videoThumbnail(v.thumbnailUrl)}
                              alt=""
                              className="w-16 h-10 rounded object-cover shrink-0 bg-secondary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{v.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {v.type} · {formatViewCount(v.viewsCount)} views
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {!scope && results.creators.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-400" /> Creators
                      </h3>
                      <div className="space-y-1">
                        {results.creators.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => navigateTo(`/creator/${c.username}`, results.query)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 text-left"
                          >
                            <img
                              src={userAvatarUrl(c.avatarUrl, c.username)}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {c.displayName ?? c.username}
                              </p>
                              <p className="text-xs text-muted-foreground">@{c.username}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {results.podcasts.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-purple-400" /> Podcasts
                      </h3>
                      <div className="space-y-1">
                        {results.podcasts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => navigateTo(`/podcast/${p.id}`, results.query)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 text-left"
                          >
                            <img
                              src={videoThumbnail(p.coverUrl)}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-secondary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.title}</p>
                              {p.category && (
                                <p className="text-xs text-muted-foreground">{p.category}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {(results.verticals?.length ?? 0) > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Film className="w-4 h-4 text-primary" /> Verticals
                      </h3>
                      <div className="space-y-1">
                        {results.verticals!.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => navigateTo(`/verticals/${v.slug}`, results.query)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 text-left"
                          >
                            <img
                              src={videoThumbnail(v.posterUrl)}
                              alt=""
                              className="w-10 h-14 rounded object-cover shrink-0 bg-secondary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{v.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {v.totalEpisodes} episodes
                                {v.tagline ? ` · ${v.tagline}` : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {searchQuery.trim() && !results && !loading && !error && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Press Enter to search for &quot;{searchQuery.trim()}&quot;
                </p>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}
