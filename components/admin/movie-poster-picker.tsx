"use client"

import { useCallback, useEffect, useState } from "react"
import { Film, Loader2, Search, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchTmdbMovieDetails,
  fetchTmdbMoviePosters,
  fetchTmdbPosterFile,
  type TmdbMovieDetails,
  type TmdbMoviePosterResult,
} from "@/lib/api/admin"

type CastRow = { name: string; role: string }

type Props = {
  movieTitle: string
  posterFile: File | null
  posterPreview: string | null
  existingPosterUrl?: string | null
  posterRequired?: boolean
  autoSearch?: boolean
  onPosterChange: (file: File | null, previewUrl: string | null) => void
  onDetailsApply?: (details: TmdbMovieDetails) => void
}

export function MoviePosterPicker({
  movieTitle,
  posterFile,
  posterPreview,
  existingPosterUrl = null,
  posterRequired = true,
  autoSearch = true,
  onPosterChange,
  onDetailsApply,
}: Props) {
  const [suggested, setSuggested] = useState<TmdbMoviePosterResult | null>(null)
  const [results, setResults] = useState<TmdbMoviePosterResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [manualOpen, setManualOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tmdbConfigured, setTmdbConfigured] = useState(true)
  const [lookupMode, setLookupMode] = useState<"api" | "scrape" | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  const displayPreview =
    posterPreview ?? existingPosterUrl ?? null

  const applyTmdbMovie = useCallback(
    async (item: TmdbMoviePosterResult) => {
      setAccepting(true)
      setLookupError(null)
      try {
        const details = await fetchTmdbMovieDetails(item.tmdbId)
        if (details.posterUrl ?? item.posterUrl) {
          const file = await fetchTmdbPosterFile(item.tmdbId)
          const preview = URL.createObjectURL(file)
          onPosterChange(file, preview)
        }
        onDetailsApply?.(details)
        setManualOpen(false)
      } catch (e) {
        setLookupError(
          e instanceof Error ? e.message : "Could not import TMDB data",
        )
      } finally {
        setAccepting(false)
      }
    },
    [onDetailsApply, onPosterChange],
  )

  const runSearch = useCallback(async (query: string) => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggested(null)
      setResults([])
      return
    }
    setLoading(true)
    setLookupError(null)
    try {
      const res = await fetchTmdbMoviePosters(q)
      setTmdbConfigured(res.configured)
      setLookupMode(res.mode)
      setResults(res.items)
      setSuggested(res.items[0] ?? null)
      if (!res.configured) {
        setLookupError(
          res.mode === "api"
            ? "TMDB API mode requires TMDB_API_KEY in api/.env, or set TMDB_POSTER_LOOKUP_MODE=scrape."
            : "TMDB poster lookup is not available on the server.",
        )
      } else if (!res.items.length) {
        setLookupError(`No movies found for "${q}". Try a different search.`)
      }
    } catch (e) {
      setSuggested(null)
      setResults([])
      setLookupError(e instanceof Error ? e.message : "TMDB lookup failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!autoSearch || !movieTitle.trim()) return
    if (posterRequired && posterFile) return
    const timer = window.setTimeout(() => {
      void runSearch(movieTitle)
    }, 600)
    return () => window.clearTimeout(timer)
  }, [movieTitle, posterFile, posterRequired, autoSearch, runSearch])

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        {posterRequired ? "Movie poster *" : "Movie poster"}
      </p>

      {!posterFile && suggested && !manualOpen ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Found on TMDB for &ldquo;{movieTitle.trim()}&rdquo;
          </p>
          <div className="flex gap-4 items-start">
            <img
              src={suggested.posterUrl}
              alt={suggested.title}
              className="w-24 aspect-[2/3] object-cover rounded-lg border border-border shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-semibold text-sm leading-snug">
                {suggested.title}
                {suggested.releaseYear ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    ({suggested.releaseYear})
                  </span>
                ) : null}
              </p>
              {suggested.overview ? (
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {suggested.overview}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              disabled={accepting}
              onClick={() => void applyTmdbMovie(suggested)}
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Import poster & details"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setManualOpen(true)
                setSearchQuery(movieTitle.trim())
                void runSearch(movieTitle.trim())
              }}
            >
              Search manually
            </Button>
          </div>
        </div>
      ) : null}

      {(!suggested || manualOpen || posterFile || !autoSearch) &&
      !posterFile ? (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={searchQuery || movieTitle}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TMDB…"
              className="flex-1 h-10 px-3 rounded-lg bg-secondary text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void runSearch(searchQuery || movieTitle)
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="shrink-0 rounded-lg"
              onClick={() => void runSearch(searchQuery || movieTitle)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
          {results.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto">
              {results.map((item) => (
                <button
                  key={item.tmdbId}
                  type="button"
                  className="text-left rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-colors"
                  onClick={() => void applyTmdbMovie(item)}
                  disabled={accepting}
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  <p className="text-[10px] font-medium p-1.5 line-clamp-2 leading-tight">
                    {item.title}
                    {item.releaseYear ? ` (${item.releaseYear})` : ""}
                  </p>
                </button>
              ))}
            </div>
          ) : null}
          {manualOpen ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setManualOpen(false)}
            >
              Back to suggestion
            </Button>
          ) : null}
        </div>
      ) : null}

      {loading && !posterFile && !suggested ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Looking up movie on TMDB…
        </div>
      ) : null}

      {lookupError && !posterFile ? (
        <p className="text-xs text-muted-foreground">{lookupError}</p>
      ) : null}

      {!tmdbConfigured && !posterFile ? (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          {lookupMode === "scrape"
            ? "TMDB scrape mode is enabled but lookup failed. Try again or upload manually."
            : "TMDB API mode needs TMDB_API_KEY in api/.env, or set TMDB_POSTER_LOOKUP_MODE=scrape."}
        </p>
      ) : null}

      <label className="block p-6 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary/50">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const next = e.target.files?.[0] ?? null
            const preview = next ? URL.createObjectURL(next) : null
            onPosterChange(next, preview)
            setSuggested(null)
            setManualOpen(false)
          }}
        />
        {displayPreview ? (
          <img
            src={displayPreview}
            alt="Poster preview"
            className="mx-auto mb-3 w-32 aspect-[2/3] object-cover rounded-lg border border-border"
          />
        ) : (
          <Film className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        )}
        <p className="text-sm font-medium flex items-center justify-center gap-1.5">
          <Upload className="w-4 h-4" />
          {posterFile ? posterFile.name : "Upload poster from device"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Portrait 2:3 recommended (JPG, PNG, or WebP)
        </p>
      </label>

      {posterFile ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() => {
            onPosterChange(null, null)
            setSuggested(null)
            setManualOpen(false)
            if (movieTitle.trim()) void runSearch(movieTitle)
          }}
        >
          Clear poster & search again
        </Button>
      ) : null}
    </div>
  )
}

export type { CastRow }
