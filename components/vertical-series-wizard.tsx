"use client"

import { useEffect, useMemo, useState } from "react"
import {
  X,
  Upload,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { slugifyTitle } from "@/lib/slugify"
import {
  initBannerUpload,
  uploadProfileImage,
} from "@/lib/api/profile-upload"
import {
  attachVerticalEpisodeVideo,
  createVerticalEpisode,
  createVerticalSeries,
  fetchMyVerticalSeries,
} from "@/lib/api/verticals-admin"
import {
  getVideoUploadMaxBytes,
  pollVideoUntilReady,
  uploadVideoFlow,
} from "@/lib/api/videos"

const GENRES = [
  "Drama",
  "Romance",
  "Thriller",
  "Comedy",
  "Fantasy",
  "Action",
  "Mystery",
]

type WizardMode = "choose" | "series" | "episode" | "done"

interface VerticalSeriesWizardProps {
  isOpen: boolean
  onClose: () => void
  /** Skip chooser and go straight to new series or add episode */
  initialIntent?: "new_series" | "add_episode"
  onSuccess?: () => void
}

type SeriesRow = {
  id: string
  slug: string
  title: string
  episodes: Array<{ id: string; episodeNumber: number; title: string }>
}

export function VerticalSeriesWizard({
  isOpen,
  onClose,
  initialIntent,
  onSuccess,
}: VerticalSeriesWizardProps) {
  const [mode, setMode] = useState<WizardMode>("choose")
  const [mySeries, setMySeries] = useState<SeriesRow[]>([])
  const [loadingSeries, setLoadingSeries] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Series fields
  const [seriesTitle, setSeriesTitle] = useState("")
  const [seriesSlug, setSeriesSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("Drama")
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [createdSeriesSlug, setCreatedSeriesSlug] = useState<string | null>(null)

  // Episode fields
  const [selectedSlug, setSelectedSlug] = useState("")
  const [episodeNumber, setEpisodeNumber] = useState(1)
  const [episodeTitle, setEpisodeTitle] = useState("")
  const [cliffhanger, setCliffhanger] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const activeSlug = createdSeriesSlug ?? selectedSlug

  const selectedSeries = useMemo(
    () => mySeries.find((s) => s.slug === activeSlug),
    [mySeries, activeSlug],
  )

  const nextEpisodeNumber = useMemo(() => {
    if (!selectedSeries?.episodes.length) return 1
    return Math.max(...selectedSeries.episodes.map((e) => e.episodeNumber)) + 1
  }, [selectedSeries])

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setBusy(false)
    setProcessing(false)
    setUploadProgress(0)
    setSeriesTitle("")
    setSeriesSlug("")
    setSlugTouched(false)
    setTagline("")
    setDescription("")
    setGenre("Drama")
    setPosterFile(null)
    setPosterPreview(null)
    setCreatedSeriesSlug(null)
    setEpisodeTitle("")
    setCliffhanger("")
    setVideoFile(null)

    if (initialIntent === "new_series") setMode("series")
    else if (initialIntent === "add_episode") setMode("episode")
    else setMode("choose")
  }, [isOpen, initialIntent])

  useEffect(() => {
    if (!isOpen) return
    setLoadingSeries(true)
    void fetchMyVerticalSeries()
      .then((res) => {
        setMySeries(res.items)
        if (res.items[0]) setSelectedSlug(res.items[0].slug)
      })
      .catch(() => setMySeries([]))
      .finally(() => setLoadingSeries(false))
  }, [isOpen])

  useEffect(() => {
    if (slugTouched) return
    if (seriesTitle.trim()) setSeriesSlug(slugifyTitle(seriesTitle))
  }, [seriesTitle, slugTouched])

  useEffect(() => {
    if (mode === "episode" && !episodeNumber) {
      setEpisodeNumber(nextEpisodeNumber)
    }
  }, [mode, nextEpisodeNumber, episodeNumber])

  useEffect(() => {
    if (mode === "episode") setEpisodeNumber(nextEpisodeNumber)
  }, [selectedSlug, mode, nextEpisodeNumber])

  useEffect(() => {
    if (!posterFile) {
      setPosterPreview(null)
      return
    }
    const url = URL.createObjectURL(posterFile)
    setPosterPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [posterFile])

  if (!isOpen) return null

  const handleCreateSeries = async () => {
    if (!seriesTitle.trim() || !seriesSlug.trim()) {
      setError("Series title and URL slug are required")
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(seriesSlug)) {
      setError("Slug must be lowercase letters, numbers, and hyphens only")
      return
    }

    setBusy(true)
    setError(null)
    try {
      let posterUrl: string | undefined
      if (posterFile) {
        const init = await initBannerUpload(posterFile)
        posterUrl = await uploadProfileImage(init, posterFile)
      }

      await createVerticalSeries({
        slug: seriesSlug.trim(),
        title: seriesTitle.trim(),
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        genre,
        posterUrl,
      })

      setCreatedSeriesSlug(seriesSlug.trim())
      setSelectedSlug(seriesSlug.trim())
      const res = await fetchMyVerticalSeries()
      setMySeries(res.items)
      setMode("episode")
      setEpisodeNumber(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create series")
    } finally {
      setBusy(false)
    }
  }

  const handleUploadEpisode = async () => {
    const slug = activeSlug
    if (!slug || !episodeTitle.trim() || !videoFile) {
      setError("Series, episode title, and video file are required")
      return
    }

    const maxBytes = getVideoUploadMaxBytes()
    if (maxBytes && videoFile.size > maxBytes) {
      setError(`Video exceeds ${Math.round(maxBytes / (1024 * 1024))} MB limit`)
      return
    }

    setBusy(true)
    setError(null)
    setUploadProgress(0)

    try {
      const ep = (await createVerticalEpisode(slug, {
        episodeNumber,
        title: episodeTitle.trim(),
        cliffhanger: cliffhanger.trim() || undefined,
      })) as { id: string }

      const uploaded = await uploadVideoFlow(
        {
          type: "video",
          title: episodeTitle.trim(),
          mimeType: videoFile.type,
          fileName: videoFile.name,
        },
        videoFile,
        setUploadProgress,
      )

      setBusy(false)
      setProcessing(true)
      await pollVideoUntilReady(uploaded.videoId)
      await attachVerticalEpisodeVideo(ep.id, uploaded.videoId)

      setMode("done")
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Episode upload failed")
      setProcessing(false)
    } finally {
      setBusy(false)
    }
  }

  const stepLabel =
    mode === "choose"
      ? "Get started"
      : mode === "series"
        ? "Step 1 · Series details"
        : mode === "episode"
          ? createdSeriesSlug
            ? "Step 2 · First episode"
            : "Upload episode"
          : "Complete"

  return (
    <div
      className="fixed inset-0 z-[95] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          {mode !== "choose" && mode !== "done" && (
            <button
              type="button"
              onClick={() => {
                if (mode === "episode" && createdSeriesSlug) setMode("series")
                else if (mode === "episode") setMode("choose")
                else setMode("choose")
              }}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">Micro-drama series</h2>
            <p className="text-xs text-muted-foreground">{stepLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          {mode === "choose" && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground text-center pb-2">
                Set up your series first, then upload vertical episodes one at a time.
              </p>
              <button
                type="button"
                onClick={() => setMode("series")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/60 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Create a new series</p>
                  <p className="text-xs text-muted-foreground">
                    Name, description, cover art — then add episodes
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                type="button"
                disabled={loadingSeries || mySeries.length === 0}
                onClick={() => setMode("episode")}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border text-left",
                  mySeries.length === 0
                    ? "opacity-50 border-border"
                    : "border-border hover:bg-secondary/60",
                )}
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Add episode to existing series</p>
                  <p className="text-xs text-muted-foreground">
                    {mySeries.length === 0
                      ? "Create a series first"
                      : `${mySeries.length} series on your account`}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {mode === "series" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Series title *
                </label>
                <input
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="Midnight Contract"
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  URL slug *
                </label>
                <input
                  value={seriesSlug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSeriesSlug(e.target.value.toLowerCase())
                  }}
                  placeholder="midnight-contract"
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  prysym.tv/verticals/{seriesSlug || "your-slug"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Tagline
                </label>
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="She signed the deal of a lifetime…"
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this series about?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-secondary text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Cover poster (9:16 recommended)
                </label>
                <label
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                    posterFile ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
                  />
                  {posterPreview ? (
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="w-20 aspect-[9/16] rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 aspect-[9/16] rounded-lg bg-secondary flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 text-sm">
                    <p className="font-medium">
                      {posterFile ? posterFile.name : "Upload cover image"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Shown on the Verticals browse page
                    </p>
                  </div>
                </label>
              </div>
              <Button
                onClick={() => void handleCreateSeries()}
                disabled={busy || !seriesTitle.trim() || !seriesSlug.trim()}
                className="w-full rounded-full h-12"
              >
                {busy ? "Creating series…" : "Continue to episode upload"}
              </Button>
            </div>
          )}

          {mode === "episode" && (
            <div className="space-y-4">
              {processing ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-semibold">Processing episode…</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Transcoding your vertical video for playback.
                  </p>
                </div>
              ) : (
                <>
                  {!createdSeriesSlug && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Series *
                      </label>
                      <select
                        value={selectedSlug}
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                      >
                        {mySeries.map((s) => (
                          <option key={s.slug} value={s.slug}>
                            {s.title} ({s.episodes.length} eps)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedSeries && (
                    <div className="p-3 rounded-xl bg-secondary/40 text-sm">
                      <p className="font-medium">{selectedSeries.title}</p>
                      <p className="text-xs text-muted-foreground">
                        /{selectedSeries.slug}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Episode #
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={episodeNumber}
                        onChange={(e) =>
                          setEpisodeNumber(Number(e.target.value) || 1)
                        }
                        className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <p className="text-xs text-muted-foreground pb-3">
                        Suggested: Ep {nextEpisodeNumber}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Episode title *
                    </label>
                    <input
                      value={episodeTitle}
                      onChange={(e) => setEpisodeTitle(e.target.value)}
                      placeholder="The meeting"
                      className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Cliffhanger hook (optional)
                    </label>
                    <input
                      value={cliffhanger}
                      onChange={(e) => setCliffhanger(e.target.value)}
                      placeholder="But the contract had one hidden clause…"
                      className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Episode video (9:16) *
                    </label>
                    <label
                      className={cn(
                        "block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
                        videoFile ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                      />
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        {videoFile ? videoFile.name : "Choose vertical video"}
                      </p>
                    </label>
                  </div>

                  {busy && uploadProgress > 0 && (
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <Button
                    onClick={() => void handleUploadEpisode()}
                    disabled={busy || !episodeTitle.trim() || !videoFile}
                    className="w-full rounded-full h-12"
                  >
                    {busy
                      ? `Uploading${uploadProgress ? ` ${uploadProgress}%` : "…"}`
                      : "Publish episode"}
                  </Button>

                  {createdSeriesSlug && (
                    <Button
                      variant="ghost"
                      className="w-full rounded-full"
                      onClick={onClose}
                    >
                      Add first episode later
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {mode === "done" && (
            <div className="py-10 text-center">
              <Check className="w-14 h-14 text-primary mx-auto mb-3" />
              <p className="font-semibold text-lg">Episode published</p>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                {selectedSeries?.title ?? "Your series"} · Episode {episodeNumber}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="rounded-full"
                  onClick={() => {
                    setCreatedSeriesSlug(null)
                    setEpisodeTitle("")
                    setVideoFile(null)
                    setCliffhanger("")
                    setMode("episode")
                  }}
                >
                  Add another episode
                </Button>
                <Button variant="secondary" className="rounded-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
