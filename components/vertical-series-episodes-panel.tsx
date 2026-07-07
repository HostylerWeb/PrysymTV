"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  deleteVerticalEpisode,
  updateVerticalEpisode,
} from "@/lib/api/verticals-admin"
import { notify } from "@/lib/site-notifications"
import { useConfirm } from "@/contexts/confirm-context"

type EpisodeRow = {
  id: string
  episodeNumber: number
  title: string
  description?: string | null
  cliffhanger?: string | null
}

type SeriesRow = {
  id: string
  slug: string
  title: string
  episodes: EpisodeRow[]
}

type VerticalSeriesEpisodesPanelProps = {
  series: SeriesRow[]
  onChanged: () => void
}

export function VerticalSeriesEpisodesPanel({
  series,
  onChanged,
}: VerticalSeriesEpisodesPanelProps) {
  const confirm = useConfirm()
  const [editing, setEditing] = useState<EpisodeRow | null>(null)
  const [episodeNumber, setEpisodeNumber] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [cliffhanger, setCliffhanger] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const openEdit = (ep: EpisodeRow) => {
    setEditing(ep)
    setEpisodeNumber(String(ep.episodeNumber))
    setTitle(ep.title)
    setDescription(ep.description ?? "")
    setCliffhanger(ep.cliffhanger ?? "")
    setMessage(null)
  }

  const closeEdit = () => {
    if (busy) return
    setEditing(null)
    setMessage(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    const num = parseInt(episodeNumber, 10)
    if (!title.trim() || !Number.isFinite(num) || num < 1) {
      setMessage("Episode number and title are required.")
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await updateVerticalEpisode(editing.id, {
        episodeNumber: num,
        title: title.trim(),
        description: description.trim() || undefined,
        cliffhanger: cliffhanger.trim() || undefined,
      })
      closeEdit()
      onChanged()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save episode.")
    } finally {
      setBusy(false)
    }
  }

  const removeEpisode = async (ep: EpisodeRow) => {
    const ok = await confirm({
      title: `Delete episode ${ep.episodeNumber}?`,
      description: `“${ep.title}” will be removed permanently.`,
      confirmLabel: "Delete",
      variant: "destructive",
    })
    if (!ok) return
    setBusy(true)
    try {
      await deleteVerticalEpisode(ep.id)
      onChanged()
      notify.success("Episode deleted")
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Could not delete episode.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="space-y-2 border-t border-border pt-4">
        <h4 className="text-sm font-semibold">Your series</h4>
        <ul className="space-y-3">
          {series.map((s) => (
            <li key={s.id} className="p-3 rounded-xl bg-secondary/30 text-sm space-y-2">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  /{s.slug} · {s.episodes.length} episode
                  {s.episodes.length === 1 ? "" : "s"}
                </p>
              </div>
              {s.episodes.length > 0 && (
                <ul className="space-y-1 border-t border-border/60 pt-2">
                  {s.episodes.map((ep) => (
                    <li
                      key={ep.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate">
                        Ep {ep.episodeNumber}: {ep.title}
                      </span>
                      <span className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openEdit(ep)}
                          className="p-1.5 rounded-md hover:bg-secondary"
                          aria-label={`Edit episode ${ep.episodeNumber}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeEpisode(ep)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                          aria-label={`Delete episode ${ep.episodeNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={editing != null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit episode</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <label className="block text-xs font-medium">
              Episode #
              <input
                type="number"
                min={1}
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
            </label>
            <label className="block text-xs font-medium">
              Cliffhanger
              <input
                value={cliffhanger}
                onChange={(e) => setCliffhanger(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            {message && <p className="text-xs text-destructive">{message}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeEdit} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
