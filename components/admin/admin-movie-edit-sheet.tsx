"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Film, Plus, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminMovieGenresConfig,
  fetchAdminVideo,
  updateAdminVideo,
  type TmdbMovieDetails,
} from "@/lib/api/admin"
import { uploadMoviePoster } from "@/lib/api/videos"
import { moviePosterUrl } from "@/lib/format-media"
import { MoviePosterPicker } from "@/components/admin/movie-poster-picker"

const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "TV-MA", "NR"]

type CastRow = { name: string; role: string }

interface AdminMovieEditSheetProps {
  videoId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdminMovieEditSheet({
  videoId,
  isOpen,
  onClose,
  onSuccess,
}: AdminMovieEditSheetProps) {
  const { data: genres } = useAdminQuery(fetchAdminMovieGenresConfig, [])
  const activeGenres = useMemo(
    () => (genres ?? []).filter((g) => g.isActive),
    [genres],
  )
  const defaultGenreSlug = activeGenres[0]?.slug ?? "drama"

  const { data: video, loading, error, reload } = useAdminQuery(
    () => fetchAdminVideo(videoId),
    [videoId],
  )

  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("drama")
  const [director, setDirector] = useState("")
  const [writers, setWriters] = useState("")
  const [cast, setCast] = useState<CastRow[]>([{ name: "", role: "" }])
  const [releaseYear, setReleaseYear] = useState(String(new Date().getFullYear()))
  const [ageRating, setAgeRating] = useState("PG-13")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [formVideoId, setFormVideoId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setDone(false)
      setSaveError(null)
      setFormVideoId(null)
      setPosterFile(null)
      setPosterPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !video || formVideoId === videoId) return

    setTitle(video.title)
    setTagline(video.tagline)
    setDescription(video.description)
    setGenre(video.category || defaultGenreSlug)
    setDirector(video.director)
    setWriters(video.writers)
    setCast(video.cast.length ? video.cast : [{ name: "", role: "" }])
    setReleaseYear(String(video.releaseYear ?? new Date().getFullYear()))
    setAgeRating(video.ageRating || "PG-13")
    setPosterUrl(video.posterUrl)
    setPosterFile(null)
    setPosterPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setSaveError(null)
    setDone(false)
    setFormVideoId(videoId)
  }, [isOpen, video, videoId, formVideoId, defaultGenreSlug])

  if (!isOpen) return null

  const updateCast = (index: number, patch: Partial<CastRow>) => {
    setCast((rows) => {
      const next = [...rows]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const applyTmdbDetails = (details: TmdbMovieDetails) => {
    if (details.title) setTitle(details.title)
    if (details.tagline) setTagline(details.tagline)
    if (details.overview) setDescription(details.overview)
    if (details.director) setDirector(details.director)
    if (details.writers.length) setWriters(details.writers.join(", "))
    if (details.releaseYear) setReleaseYear(String(details.releaseYear))
    if (details.cast.length) {
      setCast(details.cast.map((member) => ({ name: member.name, role: member.role })))
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !videoId) return

    const year = Number.parseInt(releaseYear, 10)
    if (!Number.isFinite(year) || year < 1888 || year > 2100) {
      setSaveError("Enter a valid release year")
      return
    }

    const castPayload = cast
      .map((c) => ({ name: c.name.trim(), role: c.role.trim() }))
      .filter((c) => c.name && c.role)

    setBusy(true)
    setSaveError(null)
    try {
      if (posterFile) {
        const url = await uploadMoviePoster(videoId, posterFile)
        setPosterUrl(url)
        setPosterFile(null)
        setPosterPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return null
        })
      }

      await updateAdminVideo(videoId, {
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        category: genre,
        director: director.trim(),
        writers: writers.trim(),
        releaseYear: year,
        ageRating,
        cast: castPayload,
      })
      setDone(true)
      onSuccess?.()
      void reload()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Edit movie</h2>
            <p className="text-xs text-muted-foreground truncate">
              {video?.title ?? "Loading…"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {loading && !video ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Loading movie…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-10">{error}</p>
          ) : done ? (
            <div className="py-10 text-center">
              <Check className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="font-semibold">Movie updated</p>
              <p className="text-sm text-muted-foreground mt-1">
                Changes are live on the catalog page.
              </p>
              <Button onClick={onClose} className="mt-6 rounded-full w-full">
                Done
              </Button>
            </div>
          ) : (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Movie title *"
                className="w-full h-12 px-4 rounded-xl bg-secondary text-sm"
              />
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Tagline (short hook)"
                className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                maxLength={300}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Synopsis"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-sm resize-none"
                maxLength={5000}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                >
                  {activeGenres.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <select
                  value={ageRating}
                  onChange={(e) => setAgeRating(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                >
                  {AGE_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                placeholder="Release year"
                className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
              />
              <input
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="Director"
                className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
              />
              <input
                value={writers}
                onChange={(e) => setWriters(e.target.value)}
                placeholder="Writers (comma-separated)"
                className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Main cast</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setCast((rows) => [...rows, { name: "", role: "" }])}
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
                {cast.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={row.name}
                      onChange={(e) => updateCast(index, { name: e.target.value })}
                      placeholder="Actor name"
                      className="flex-1 h-10 px-3 rounded-lg bg-secondary text-sm"
                    />
                    <input
                      value={row.role}
                      onChange={(e) => updateCast(index, { role: e.target.value })}
                      placeholder="Role"
                      className="flex-1 h-10 px-3 rounded-lg bg-secondary text-sm"
                    />
                    {cast.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCast((rows) => rows.filter((_, i) => i !== index))}
                        className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground"
                        aria-label="Remove cast member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <MoviePosterPicker
                movieTitle={title}
                posterFile={posterFile}
                posterPreview={posterPreview}
                existingPosterUrl={moviePosterUrl({
                  posterUrl,
                  thumbnailUrl: null,
                })}
                posterRequired={false}
                autoSearch={false}
                onPosterChange={(file, preview) => {
                  setPosterFile(file)
                  setPosterPreview((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return preview
                  })
                }}
                onDetailsApply={applyTmdbDetails}
              />
              <p className="text-xs text-muted-foreground -mt-1">
                Search TMDB above to import a new poster, tagline, synopsis, director, writers, and cast for this movie.
              </p>
              <p className="text-xs text-muted-foreground">
                Video file cannot be changed here. Delete and re-upload to replace the file.
              </p>
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <Button
                className="w-full rounded-full"
                disabled={busy || !title.trim()}
                onClick={() => void handleSave()}
              >
                {busy
                  ? posterFile
                    ? "Saving poster & details…"
                    : "Saving…"
                  : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
