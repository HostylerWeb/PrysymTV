"use client"

import { useEffect, useState } from "react"
import { X, Upload, Check, Video, Headphones, ListMusic, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  getVideoUploadMaxBytes,
  uploadVideoFlow,
} from "@/lib/api/videos"
import { UploadQueuedSuccess } from "@/components/upload-queued-success"
import {
  createPodcastShow,
  fetchMyPodcastShows,
  uploadPodcastEpisodeFlow,
  uploadPodcastShowCover,
  type MyPodcastShow,
} from "@/lib/api/podcasts-admin"
import {
  addPlaylistItem,
  fetchMyPlaylists,
  type PlaylistSummary,
} from "@/lib/api/playlists"
import {
  fetchPodcastCategories,
  fetchVideoCategories,
  type ContentCategory,
} from "@/lib/api/categories"

export type CreatorUploadKind = "short" | "video" | "podcast"

const KIND_META: Record<
  CreatorUploadKind,
  { title: string; icon: typeof Video; accept: string; hint: string }
> = {
  short: {
    title: "Upload Short",
    icon: Video,
    accept: "video/*",
    hint: "Vertical clip, ideally under 60 seconds",
  },
  video: {
    title: "Upload Video",
    icon: Video,
    accept: "video/*",
    hint: "Long-form horizontal video",
  },
  podcast: {
    title: "Podcast Episode",
    icon: Headphones,
    accept: "audio/*,video/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.webm,.mp4,.mov,.mkv",
    hint: "Upload an audio or video episode. Add show artwork when creating a new show.",
  },
}

const FALLBACK_VIDEO_UPLOAD_CATEGORIES: ContentCategory[] = [
  { slug: "general", label: "General", vertical: "general" },
  { slug: "sports", label: "Sports", vertical: "sports" },
  { slug: "concerts", label: "Concerts", vertical: "concert" },
  { slug: "community", label: "Community", vertical: "community_event" },
  { slug: "education", label: "Education", vertical: "education" },
]

const FALLBACK_PODCAST_CATEGORIES: ContentCategory[] = [
  { slug: "general", label: "General" },
  { slug: "tech", label: "Tech" },
  { slug: "true-crime", label: "True Crime" },
]

const VISIBILITY_OPTIONS: Array<{
  value: "public" | "unlisted" | "private"
  label: string
}> = [
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
]

interface CreatorUploadSheetProps {
  isOpen: boolean
  onClose: () => void
  kind: CreatorUploadKind
  onSuccess?: () => void
}

function playlistAcceptsKind(
  p: PlaylistSummary,
  kind: CreatorUploadKind,
): boolean {
  if (p.type === "mixed") return true
  if (kind === "podcast") return p.type === "podcast"
  return p.type === "video"
}

export function CreatorUploadSheet({
  isOpen,
  onClose,
  kind,
  onSuccess,
}: CreatorUploadSheetProps) {
  const { user } = useAuth()
  const meta = KIND_META[kind]
  const Icon = meta.icon

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("general")
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">(
    "public",
  )
  const [tags, setTags] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [thumbnailMode, setThumbnailMode] = useState<"auto" | "custom">("auto")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  const [podcastShows, setPodcastShows] = useState<MyPodcastShow[]>([])
  const [showId, setShowId] = useState("")
  const [newShowTitle, setNewShowTitle] = useState("")
  const [newShowDescription, setNewShowDescription] = useState("")
  const [newShowCategory, setNewShowCategory] = useState("General")
  const [newShowCoverFile, setNewShowCoverFile] = useState<File | null>(null)
  const [newShowCoverPreview, setNewShowCoverPreview] = useState<string | null>(null)
  const [podcastMode, setPodcastMode] = useState<"existing" | "new">("existing")
  const [podcastMediaType, setPodcastMediaType] = useState<"audio" | "video">("audio")

  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(
    new Set(),
  )
  const [videoCategories, setVideoCategories] = useState<ContentCategory[]>(
    FALLBACK_VIDEO_UPLOAD_CATEGORIES,
  )
  const [podcastCategories, setPodcastCategories] = useState<ContentCategory[]>(
    FALLBACK_PODCAST_CATEGORIES,
  )

  useEffect(() => {
    if (!isOpen) return
    setTitle("")
    setDescription("")
    setCategory("general")
    setVisibility("public")
    setTags("")
    setFile(null)
    setThumbnailMode("auto")
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setProgress(0)
    setError(null)
    setBusy(false)
    setDone(false)
    setDoneMessage(null)
    setShowId("")
    setNewShowTitle("")
    setNewShowDescription("")
    setNewShowCategory("General")
    setNewShowCoverFile(null)
    setNewShowCoverPreview(null)
    setPodcastMode("existing")
    setPodcastMediaType("audio")
    setSelectedPlaylistIds(new Set())
  }, [isOpen, kind])

  useEffect(() => {
    if (!isOpen || kind !== "podcast") return
    void fetchMyPodcastShows()
      .then((res) => {
        setPodcastShows(res.items)
        if (res.items[0]) {
          setShowId(res.items[0].id)
          setPodcastMode("existing")
        } else {
          setPodcastMode("new")
        }
      })
      .catch(() => {
        setPodcastShows([])
        setPodcastMode("new")
      })
  }, [isOpen, kind])

  useEffect(() => {
    if (!isOpen) return
    if (kind === "video") {
      void fetchVideoCategories()
        .then((res) => {
          if (res.items.length > 0) setVideoCategories(res.items)
        })
        .catch(() => setVideoCategories(FALLBACK_VIDEO_UPLOAD_CATEGORIES))
    }
    if (kind === "podcast") {
      void fetchPodcastCategories()
        .then((res) => {
          if (res.items.length > 0) setPodcastCategories(res.items)
          if (res.items[0]) setNewShowCategory(res.items[0].label)
        })
        .catch(() => setPodcastCategories(FALLBACK_PODCAST_CATEGORIES))
    }
  }, [isOpen, kind])

  useEffect(() => {
    if (!isOpen || !user) return
    void fetchMyPlaylists()
      .then((res) =>
        setPlaylists(res.items.filter((p) => playlistAcceptsKind(p, kind))),
      )
      .catch(() => setPlaylists([]))
  }, [isOpen, kind, user])

  if (!isOpen) return null

  const togglePlaylist = (id: string) => {
    setSelectedPlaylistIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const assignPlaylists = async (
    itemType: "video" | "podcast_episode",
    itemId: string,
  ) => {
    for (const playlistId of selectedPlaylistIds) {
      try {
        await addPlaylistItem(playlistId, { itemType, itemId })
      } catch {
        /* duplicate or race — ignore */
      }
    }
  }

  const handleUpload = async () => {
    if (!user || !title.trim() || !file) return

    const maxBytes = getVideoUploadMaxBytes()
    if (maxBytes && file.size > maxBytes) {
      setError(`File exceeds ${Math.round(maxBytes / (1024 * 1024))} MB limit`)
      return
    }

    setBusy(true)
    setError(null)
    setProgress(0)

    try {
      if (kind === "podcast") {
        const mime = file.type || ""
        const isVideoFile = mime.startsWith("video/") || /\.(mp4|mov|mkv|m4v|webm)$/i.test(file.name)
        if (podcastMediaType === "audio" && isVideoFile) {
          setError("You selected Audio — choose an audio file or switch to Video.")
          setBusy(false)
          return
        }
        if (podcastMediaType === "video" && !isVideoFile && mime.startsWith("audio/")) {
          setError("You selected Video — choose a video file or switch to Audio.")
          setBusy(false)
          return
        }
        let targetShowId = showId
        if (podcastMode === "new" || !targetShowId) {
          if (!newShowTitle.trim()) {
            setError("Enter a show title")
            setBusy(false)
            return
          }
          const created = await createPodcastShow({
            title: newShowTitle.trim(),
            description: newShowDescription.trim() || undefined,
            category: newShowCategory,
          })
          targetShowId = created.id
          if (newShowCoverFile) {
            await uploadPodcastShowCover(targetShowId, newShowCoverFile)
          }
        }
        const { episodeId } = await uploadPodcastEpisodeFlow(
          targetShowId,
          title.trim(),
          file,
          description.trim() || undefined,
        )
        await assignPlaylists("podcast_episode", episodeId)
        setDoneMessage(
          "Your podcast episode is ready and published. We'll notify you in your notifications bell.",
        )
        setDone(true)
        onSuccess?.()
        return
      }

      const queued = await uploadVideoFlow(
        {
          type: kind,
          title: title.trim(),
          description: description.trim() || undefined,
          category: kind === "video" ? category : kind === "short" ? "shorts" : undefined,
          visibility,
          tags: tags.trim() || undefined,
          mimeType: file.type,
          fileName: file.name,
        },
        file,
        setProgress,
        kind === "video" && thumbnailMode === "custom" ? thumbnailFile ?? undefined : undefined,
      )
      await assignPlaylists("video", queued.videoId)
      setDone(true)
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
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
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">{meta.title}</h2>
            <p className="text-xs text-muted-foreground truncate">{meta.hint}</p>
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
            doneMessage ? (
              <div className="py-10 text-center">
                <Check className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="font-semibold">Upload complete</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {doneMessage}
                </p>
                <Button onClick={onClose} className="mt-6 rounded-full w-full">
                  Done
                </Button>
              </div>
            ) : (
              <UploadQueuedSuccess
                contentLabel={kind === "short" ? "short" : "video"}
                onClose={onClose}
              />
            )
          ) : (
            <>
              {kind === "podcast" && (
                <div className="space-y-3">
                  {podcastShows.length > 0 && (
                    <div className="flex gap-2 p-1 rounded-xl bg-secondary/60">
                      <button
                        type="button"
                        onClick={() => setPodcastMode("existing")}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg",
                          podcastMode === "existing"
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground",
                        )}
                      >
                        Existing show
                      </button>
                      <button
                        type="button"
                        onClick={() => setPodcastMode("new")}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg",
                          podcastMode === "new"
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground",
                        )}
                      >
                        New show
                      </button>
                    </div>
                  )}
                  {podcastMode === "existing" && podcastShows.length > 0 ? (
                    <select
                      value={showId}
                      onChange={(e) => setShowId(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                    >
                      {podcastShows.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      <input
                        value={newShowTitle}
                        onChange={(e) => setNewShowTitle(e.target.value)}
                        placeholder="Show title"
                        className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                      />
                      <textarea
                        value={newShowDescription}
                        onChange={(e) => setNewShowDescription(e.target.value)}
                        placeholder="Show description"
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-secondary text-sm resize-none"
                      />
                      <select
                        value={newShowCategory}
                        onChange={(e) => setNewShowCategory(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                      >
                        {podcastCategories.map((c) => (
                          <option key={c.slug} value={c.label}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <label className="block p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-center cursor-pointer hover:border-primary/70 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const picked = e.target.files?.[0] ?? null
                            setNewShowCoverFile(picked)
                            if (newShowCoverPreview) URL.revokeObjectURL(newShowCoverPreview)
                            setNewShowCoverPreview(picked ? URL.createObjectURL(picked) : null)
                          }}
                        />
                        {newShowCoverPreview ? (
                          <img
                            src={newShowCoverPreview}
                            alt="Show cover preview"
                            className="w-24 h-24 rounded-xl object-cover mx-auto mb-2"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-primary mx-auto mb-2" />
                        )}
                        <p className="text-sm font-medium text-foreground">Show cover art</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {newShowCoverFile?.name ?? "Tap to upload artwork (recommended)"}
                        </p>
                      </label>
                    </>
                  )}
                  <div className="flex gap-2 p-1 rounded-xl bg-secondary/60">
                    <button
                      type="button"
                      onClick={() => {
                        setPodcastMediaType("audio")
                        setFile(null)
                      }}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5",
                        podcastMediaType === "audio"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      Audio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPodcastMediaType("video")
                        setFile(null)
                      }}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5",
                        podcastMediaType === "video"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      <Video className="w-3.5 h-3.5" />
                      Video
                    </button>
                  </div>
                </div>
              )}

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === "short"
                    ? "Title"
                    : kind === "podcast"
                      ? "Episode title"
                      : "Title"
                }
                className="w-full h-12 px-4 rounded-xl bg-secondary text-sm"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  kind === "podcast"
                    ? "Episode description (what listeners will see)"
                    : kind === "short"
                      ? "Caption or description (optional)"
                      : "Description — tell viewers what this video is about"
                }
                rows={kind === "video" ? 4 : 3}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-sm resize-none"
                maxLength={5000}
              />

              {kind === "video" && (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                >
                  {videoCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}

              {kind !== "podcast" && (
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (comma-separated, e.g. gaming, tutorial)"
                  className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                />
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Visibility
                </p>
                <div className="flex gap-2">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-medium border transition-colors",
                        visibility === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {playlists.length > 0 && (
                <div className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <ListMusic className="w-3.5 h-3.5" />
                    Add to playlist (optional)
                  </p>
                  <ul className="max-h-32 overflow-y-auto space-y-1">
                    {playlists.map((p) => (
                      <li key={p.id}>
                        <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPlaylistIds.has(p.id)}
                            onChange={() => togglePlaylist(p.id)}
                            className="rounded border-border"
                          />
                          <span className="truncate">{p.title}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {p.itemCount} items
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {kind === "video" && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Thumbnail
                  </p>
                  <div className="flex gap-2 p-1 rounded-xl bg-secondary/60">
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailMode("auto")
                        setThumbnailFile(null)
                        if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
                        setThumbnailPreview(null)
                      }}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-lg",
                        thumbnailMode === "auto"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      Auto from video
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailMode("custom")}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-lg",
                        thumbnailMode === "custom"
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      Upload image
                    </button>
                  </div>
                  {thumbnailMode === "auto" ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      We&apos;ll grab a frame from your video (~2 seconds in) after
                      processing.
                    </p>
                  ) : (
                    <label className="block p-4 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const picked = e.target.files?.[0] ?? null
                          setThumbnailFile(picked)
                          if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
                          setThumbnailPreview(
                            picked ? URL.createObjectURL(picked) : null,
                          )
                        }}
                      />
                      {thumbnailPreview ? (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full max-h-32 object-contain rounded-lg mx-auto mb-2"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      )}
                      <p className="text-sm font-medium">
                        {thumbnailFile?.name ?? "Choose thumbnail image"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, or WebP — 16:9 works well
                      </p>
                    </label>
                  )}
                </div>
              )}

              <label
                className={cn(
                  "block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  file
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                )}
              >
                <input
                  type="file"
                  accept={
                    kind === "podcast"
                      ? podcastMediaType === "video"
                        ? "video/*,.mp4,.mov,.mkv,.webm"
                        : "audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.webm"
                      : meta.accept
                  }
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">
                  {file
                    ? file.name
                    : kind === "podcast"
                      ? podcastMediaType === "video"
                        ? "Tap to choose video file"
                        : "Tap to choose audio file"
                      : "Tap to choose file"}
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

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                onClick={() => void handleUpload()}
                disabled={
                  !title.trim() ||
                  !file ||
                  busy ||
                  (kind === "video" &&
                    thumbnailMode === "custom" &&
                    !thumbnailFile)
                }
                className="w-full rounded-full h-12 text-base font-semibold"
              >
                {busy ? `Uploading${progress ? ` ${progress}%` : "…"}` : "Upload"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
