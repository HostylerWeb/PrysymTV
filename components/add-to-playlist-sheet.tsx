"use client"

import { useEffect, useState } from "react"
import { X, Loader2, Plus, ListMusic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  addPlaylistItem,
  createPlaylist,
  fetchMyPlaylists,
  type PlaylistSummary,
} from "@/lib/api/playlists"
import { ApiError } from "@/lib/api-client"

type AddToPlaylistSheetProps = {
  isOpen: boolean
  onClose: () => void
  itemType: "video" | "podcast_episode"
  itemId: string
  itemTitle?: string
}

export function AddToPlaylistSheet({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemTitle,
}: AddToPlaylistSheetProps) {
  const { isAuthenticated } = useAuth()
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return
    setLoading(true)
    setError(null)
    void fetchMyPlaylists()
      .then((res) => setPlaylists(res.items))
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false))
  }, [isOpen, isAuthenticated])

  if (!isOpen) return null

  const compatible = (p: PlaylistSummary) => {
    if (p.type === "mixed") return true
    if (p.type === "video") return itemType === "video"
    return itemType === "podcast_episode"
  }

  const handleAdd = async (playlistId: string) => {
    setBusyId(playlistId)
    setError(null)
    try {
      await addPlaylistItem(playlistId, { itemType, itemId })
      onClose()
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not add to playlist",
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title) return
    setCreating(true)
    setError(null)
    try {
      const type =
        itemType === "podcast_episode" ? "podcast" : ("mixed" as const)
      const created = await createPlaylist({ title, type })
      await addPlaylistItem(created.id, { itemType, itemId })
      onClose()
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not create playlist",
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-background rounded-t-3xl md:rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Save to playlist</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {itemTitle && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{itemTitle}</p>
        )}

        {!isAuthenticated ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sign in to manage playlists.
          </p>
        ) : (
          <>
            {error && (
              <p className="text-sm text-destructive mb-3 text-center">{error}</p>
            )}

            <div className="flex gap-2 mb-4">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New playlist name"
                className="flex-1 h-11 px-4 rounded-xl bg-secondary text-sm"
              />
              <Button
                type="button"
                disabled={creating || !newTitle.trim()}
                onClick={() => void handleCreate()}
                className="rounded-full shrink-0"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : playlists.filter(compatible).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No compatible playlists yet. Create one above.
              </p>
            ) : (
              <ul className="space-y-2">
                {playlists.filter(compatible).map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => void handleAdd(p.id)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/60 hover:bg-secondary text-left"
                    >
                      <span className="font-medium text-sm">{p.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.itemCount} items
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
