"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Mic, Pencil, Play, Smartphone, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { fetchMyVideos } from "@/lib/api/users"
import type { VideoRecord } from "@/lib/api/types"
import { fetchVideoDetail, updateMyVideo, deleteMyVideo } from "@/lib/api/videos"
import { fetchMyVerticalSeries } from "@/lib/api/verticals-admin"
import { VerticalSeriesEpisodesPanel } from "@/components/vertical-series-episodes-panel"
import {
  fetchMyPodcastShows,
  updatePodcastEpisode,
  type MyPodcastShow,
} from "@/lib/api/podcasts-admin"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"

type ContentTab = "videos" | "shorts" | "verticals" | "podcasts"

const CONTENT_TABS: Array<{ id: ContentTab; label: string }> = [
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "verticals", label: "Verticals" },
  { id: "podcasts", label: "Podcasts" },
]

function videoHref(video: VideoRecord) {
  if (video.type === "short") return `/shorts/${video.id}`
  if (video.type === "movie") return `/movie/${video.id}`
  return `/watch/${video.id}`
}

type ProfileMyContentProps = {
  onOpenVerticalUpload?: () => void
  onOpenPodcastUpload?: () => void
}

export function ProfileMyContent({
  onOpenVerticalUpload,
  onOpenPodcastUpload,
}: ProfileMyContentProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>("videos")
  const [loading, setLoading] = useState(true)
  const [myVideos, setMyVideos] = useState<VideoRecord[]>([])
  const [mySeries, setMySeries] = useState<
    Awaited<ReturnType<typeof fetchMyVerticalSeries>>["items"]
  >([])
  const [myPodcasts, setMyPodcasts] = useState<MyPodcastShow[]>([])

  const [editingVideo, setEditingVideo] = useState<VideoRecord | null>(null)
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")

  const [editingPodcast, setEditingPodcast] = useState<{
    id: string
    title: string
    description: string
  } | null>(null)
  const [podcastTitle, setPodcastTitle] = useState("")
  const [podcastDescription, setPodcastDescription] = useState("")

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [videosRes, seriesRes, podcastsRes] = await Promise.all([
        fetchMyVideos(1, 100),
        fetchMyVerticalSeries().catch(() => ({ items: [] })),
        fetchMyPodcastShows().catch(() => ({ items: [] })),
      ])
      setMyVideos(videosRes.items)
      setMySeries(seriesRes.items)
      setMyPodcasts(podcastsRes.items)
    } catch {
      setMyVideos([])
      setMySeries([])
      setMyPodcasts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const longVideos = myVideos.filter((v) => v.type === "video" || v.type === "movie")
  const shorts = myVideos.filter((v) => v.type === "short")

  const openVideoEdit = (video: VideoRecord) => {
    setEditingVideo(video)
    setVideoTitle(video.title)
    setVideoDescription("")
    setMessage(null)
    void fetchVideoDetail(video.id)
      .then((detail) => setVideoDescription(detail.description ?? ""))
      .catch(() => {})
  }

  const saveVideoEdit = async () => {
    if (!editingVideo || !videoTitle.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await updateMyVideo(editingVideo.id, {
        title: videoTitle.trim(),
        description: videoDescription.trim() || undefined,
      })
      setEditingVideo(null)
      await reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setBusy(false)
    }
  }

  const openPodcastEdit = (ep: {
    id: string
    title: string
    description?: string | null
  }) => {
    setEditingPodcast({
      id: ep.id,
      title: ep.title,
      description: ep.description ?? "",
    })
    setPodcastTitle(ep.title)
    setPodcastDescription(ep.description ?? "")
    setMessage(null)
  }

  const savePodcastEdit = async () => {
    if (!editingPodcast || !podcastTitle.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await updatePodcastEpisode(editingPodcast.id, {
        title: podcastTitle.trim(),
        description: podcastDescription.trim() || undefined,
      })
      setEditingPodcast(null)
      await reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.")
    } finally {
      setBusy(false)
    }
  }

  const deleteVideo = async (video: VideoRecord) => {
    const label = video.type === "short" ? "short" : video.type === "movie" ? "movie" : "video"
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return
    setBusy(true)
    setMessage(null)
    try {
      await deleteMyVideo(video.id)
      await reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not delete.")
    } finally {
      setBusy(false)
    }
  }

  const renderVideoGrid = (items: VideoRecord[], emptyMessage: string) => {
    if (loading && items.length === 0) {
      return <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
    }
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-12 text-center">{emptyMessage}</p>
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((video) => (
          <div key={video.id} className="group relative">
            <Link href={videoHref(video)} className="block">
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg bg-muted",
                  video.type === "short" ? "aspect-[9/16]" : "aspect-video",
                )}
              >
                <img
                  src={videoThumbnail(video.thumbnailUrl)}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1">
                  <p className="text-xs text-white font-medium line-clamp-2 flex-1">
                    {video.title}
                  </p>
                  <span className="text-[10px] text-white/90 bg-black/50 px-1 rounded shrink-0">
                    {formatDuration(video.durationSeconds)}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            </Link>
            <div className="mt-1 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => openVideoEdit(video)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
                aria-label={`Edit ${video.title}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void deleteVideo(video)}
                disabled={busy}
                className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50"
                aria-label={`Delete ${video.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {CONTENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && <p className="text-xs text-destructive">{message}</p>}

      {activeTab === "videos" &&
        renderVideoGrid(
          longVideos,
          "No long-form videos yet. Tap + in the header to upload.",
        )}

      {activeTab === "shorts" &&
        renderVideoGrid(shorts, "No shorts yet. Tap + in the header to upload a short.")}

      {activeTab === "verticals" && (
        <div className="space-y-4">
          {loading && mySeries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
          ) : mySeries.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Smartphone className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No vertical series yet. Create a series and upload episodes.
              </p>
              {onOpenVerticalUpload && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={onOpenVerticalUpload}
                >
                  Manage verticals
                </Button>
              )}
            </div>
          ) : (
            <>
              {onOpenVerticalUpload && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={onOpenVerticalUpload}
                  >
                    Add episode
                  </Button>
                </div>
              )}
              <VerticalSeriesEpisodesPanel series={mySeries} onChanged={() => void reload()} />
              <ul className="space-y-2">
                {mySeries.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/verticals/${s.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View {s.title} on site →
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {activeTab === "podcasts" && (
        <div className="space-y-4">
          {loading && myPodcasts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Loading…</p>
          ) : myPodcasts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Mic className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No podcast shows yet. Create a show and upload episodes in Settings.
              </p>
              {onOpenPodcastUpload && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={onOpenPodcastUpload}
                >
                  Manage podcasts
                </Button>
              )}
            </div>
          ) : (
            <>
              {onOpenPodcastUpload && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={onOpenPodcastUpload}
                  >
                    Upload episode
                  </Button>
                </div>
              )}
              <ul className="space-y-4">
                {myPodcasts.map((show) => (
                  <li key={show.id} className="p-4 rounded-xl border border-border space-y-3">
                    <div>
                      <p className="font-medium">{show.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {show._count?.episodes ?? show.episodes.length} episode
                        {(show._count?.episodes ?? show.episodes.length) === 1 ? "" : "s"}
                      </p>
                    </div>
                    {show.episodes.length > 0 ? (
                      <ul className="space-y-2 border-t border-border pt-3">
                        {show.episodes.map((ep) => (
                          <li
                            key={ep.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <Link
                              href={`/podcast/${ep.id}`}
                              className="truncate hover:text-primary flex-1 min-w-0"
                            >
                              {ep.title}
                            </Link>
                            <button
                              type="button"
                              onClick={() => openPodcastEdit(ep)}
                              className="p-1.5 rounded-md hover:bg-secondary shrink-0"
                              aria-label={`Edit ${ep.title}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No episodes yet.</p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <Dialog
        open={editingVideo != null}
        onOpenChange={(open) => !open && !busy && setEditingVideo(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit {editingVideo?.type === "short" ? "short" : "video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <input
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
            />
            {message && <p className="text-xs text-destructive">{message}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingVideo(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void saveVideoEdit()} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingPodcast != null}
        onOpenChange={(open) => !open && !busy && setEditingPodcast(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit podcast episode</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <input
              value={podcastTitle}
              onChange={(e) => setPodcastTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={podcastDescription}
              onChange={(e) => setPodcastDescription(e.target.value)}
              placeholder="Show notes / description"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
            />
            {message && <p className="text-xs text-destructive">{message}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditingPodcast(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void savePodcastEdit()} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
