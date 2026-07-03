"use client"

import { useEffect, useState } from "react"
import { X, Upload, Check, Film, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminMovieGenresConfig } from "@/lib/api/admin"
import {
  getVideoUploadMaxBytes,
  pollVideoUntilReady,
  uploadAdminMovieFlow,
  uploadMoviePoster,
} from "@/lib/api/videos"

const AGE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "TV-MA", "NR"]

type CastRow = { name: string; role: string }

interface AdminMovieUploadSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdminMovieUploadSheet({
  isOpen,
  onClose,
  onSuccess,
}: AdminMovieUploadSheetProps) {
  const { data: genres } = useAdminQuery(fetchAdminMovieGenresConfig, [])
  const activeGenres = (genres ?? []).filter((g) => g.isActive)
  const defaultGenreSlug = activeGenres[0]?.slug ?? "drama"

  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("drama")
  const [director, setDirector] = useState("")
  const [writers, setWriters] = useState("")
  const [cast, setCast] = useState<CastRow[]>([{ name: "", role: "" }])
  const [releaseYear, setReleaseYear] = useState(String(new Date().getFullYear()))
  const [ageRating, setAgeRating] = useState("PG-13")
  const [file, setFile] = useState<File | null>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setTitle("")
    setTagline("")
    setDescription("")
    setGenre(defaultGenreSlug)
    setDirector("")
    setWriters("")
    setCast([{ name: "", role: "" }])
    setReleaseYear(String(new Date().getFullYear()))
    setAgeRating("PG-13")
    setFile(null)
    setPosterFile(null)
    setPosterPreview(null)
    setProgress(0)
    setError(null)
    setBusy(false)
    setProcessing(false)
    setDone(false)
  }, [isOpen, defaultGenreSlug])

  if (!isOpen) return null

  const updateCast = (index: number, patch: Partial<CastRow>) => {
    setCast((rows) => {
      const next = [...rows]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const handleUpload = async () => {
    if (!title.trim() || !file || !posterFile) return

    const maxBytes = getVideoUploadMaxBytes()
    if (maxBytes && file.size > maxBytes) {
      setError(`File exceeds ${Math.round(maxBytes / (1024 * 1024))} MB limit`)
      return
    }

    const year = Number.parseInt(releaseYear, 10)
    if (!Number.isFinite(year) || year < 1888 || year > 2100) {
      setError("Enter a valid release year")
      return
    }

    const castPayload = cast
      .map((c) => ({ name: c.name.trim(), role: c.role.trim() }))
      .filter((c) => c.name && c.role)

    setBusy(true)
    setError(null)
    setProgress(0)

    try {
      const queued = await uploadAdminMovieFlow(
        {
          type: "movie",
          title: title.trim(),
          tagline: tagline.trim() || undefined,
          description: description.trim() || undefined,
          category: genre,
          director: director.trim() || undefined,
          writers: writers.trim() || undefined,
          cast: castPayload.length ? castPayload : undefined,
          releaseYear: year,
          ageRating,
          mimeType: file.type,
          fileName: file.name,
        },
        file,
        posterFile,
        setProgress,
      )
      setBusy(false)
      setProcessing(true)
      await pollVideoUntilReady(queued.videoId)
      setDone(true)
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
      setProcessing(false)
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
            <h2 className="font-semibold text-lg">Upload movie</h2>
            <p className="text-xs text-muted-foreground">Catalog metadata + feature video</p>
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
          {done ? (
            <div className="py-10 text-center">
              <Check className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="font-semibold">Movie uploaded</p>
              <p className="text-sm text-muted-foreground mt-1">
                Processing for playback. It will appear in the catalog when ready.
              </p>
              <Button onClick={onClose} className="mt-6 rounded-full w-full">
                Done
              </Button>
            </div>
          ) : processing ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold">Processing…</p>
              <p className="text-sm text-muted-foreground mt-1">
                Transcoding may take several minutes for long films.
              </p>
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
              <label className="block p-6 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary/50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null
                    setPosterFile(next)
                    setPosterPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev)
                      return next ? URL.createObjectURL(next) : null
                    })
                  }}
                />
                {posterPreview ? (
                  <img
                    src={posterPreview}
                    alt="Poster preview"
                    className="mx-auto mb-3 w-32 aspect-[2/3] object-cover rounded-lg border border-border"
                  />
                ) : (
                  <Film className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">
                  {posterFile ? posterFile.name : "Choose poster image *"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Portrait 2:3 recommended (JPG, PNG, or WebP)
                </p>
              </label>
              <label className="block p-8 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary/50">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {file ? file.name : "Choose video file *"}
                </p>
              </label>
              {busy && progress > 0 && (
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                className="w-full rounded-full"
                disabled={busy || !title.trim() || !file || !posterFile}
                onClick={() => void handleUpload()}
              >
                {busy ? `Uploading ${progress}%` : "Upload movie"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
