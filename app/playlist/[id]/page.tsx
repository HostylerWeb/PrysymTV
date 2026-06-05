"use client"

import { use, useEffect, useState } from "react"
import { ChevronLeft, ChevronUp, ChevronDown, Play, Grid3X3, Trash2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import {
  fetchPlaylist,
  removePlaylistItem,
  reorderPlaylistItems,
  type PlaylistDetail,
} from "@/lib/api/playlists"
import { videoThumbnail } from "@/lib/format-media"
import { useAuth } from "@/contexts/auth-context"

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [reorderBusy, setReorderBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [navTab, setNavTab] = useState("home")

  useEffect(() => {
    let cancelled = false
    void fetchPlaylist(id)
      .then((data) => {
        if (!cancelled) setPlaylist(data)
      })
      .catch(() => {
        if (!cancelled) setPlaylist(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background md:pl-20">
        <p className="text-muted-foreground">Loading playlist…</p>
      </main>
    )
  }

  if (!playlist) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background md:pl-20">
        <p className="text-muted-foreground">Playlist not found.</p>
        <Link href="/" className="text-primary text-sm">
          Back to home
        </Link>
      </main>
    )
  }

  const cover = videoThumbnail(playlist.coverUrl ?? playlist.items[0]?.coverUrl)
  const isOwner = user?.username === playlist.creatorSlug

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (!playlist || reorderBusy || toIndex < 0 || toIndex >= playlist.items.length) return
    const items = [...playlist.items]
    const [moved] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, moved)
    const itemIds = items
      .map((i) => i.playlistItemId)
      .filter((id): id is string => Boolean(id))
    if (itemIds.length !== items.length) return
    setReorderBusy(true)
    setPlaylist({ ...playlist, items })
    void reorderPlaylistItems(id, itemIds)
      .catch(() => {
        void fetchPlaylist(id).then(setPlaylist).catch(() => {})
      })
      .finally(() => setReorderBusy(false))
  }

  const handleRemove = (playlistItemId: string) => {
    if (!playlistItemId) return
    setRemovingId(playlistItemId)
    void removePlaylistItem(id, playlistItemId)
      .then(() => {
        setPlaylist((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((i) => i.playlistItemId !== playlistItemId),
                itemCount: Math.max(0, prev.itemCount - 1),
              }
            : prev,
        )
      })
      .finally(() => setRemovingId(null))
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href={`/creator/${playlist.creatorSlug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to {playlist.creatorName}
        </Link>
        <div className="flex gap-4 mb-8">
          <img src={cover} alt="" className="w-32 h-32 rounded-xl object-cover bg-secondary" />
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Grid3X3 className="w-4 h-4" /> Playlist
            </div>
            <h1 className="text-2xl font-bold mb-2">{playlist.title}</h1>
            <p className="text-sm text-muted-foreground mb-2">
              {playlist.itemCount} items · {playlist.type}
            </p>
            {playlist.description && (
              <p className="text-sm text-foreground/80">{playlist.description}</p>
            )}
          </div>
        </div>
        {playlist.items.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">This playlist is empty.</p>
        ) : (
          <div className="space-y-2">
            {playlist.items.map((item, i) => (
              <div
                key={`${item.itemType}-${item.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50"
              >
                <span className="w-6 text-center text-muted-foreground text-sm">{i + 1}</span>
                <Link href={item.href} className="flex flex-1 items-center gap-4 min-w-0">
                  <img
                    src={videoThumbnail(item.coverUrl)}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <Play className="w-4 h-4 text-primary shrink-0" />
                </Link>
                {isOwner && item.playlistItemId ? (
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={reorderBusy || i === 0}
                      onClick={() => moveItem(i, i - 1)}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={reorderBusy || i === playlist.items.length - 1}
                      onClick={() => moveItem(i, i + 1)}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={removingId === item.playlistItemId}
                      onClick={() => handleRemove(item.playlistItemId!)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Remove from playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
