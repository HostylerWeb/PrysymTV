"use client"

import { useEffect, useState } from "react"
import { Check, Smartphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminVerticalSeriesDetail,
  updateAdminVerticalSeries,
} from "@/lib/api/admin"

interface AdminVerticalSeriesEditSheetProps {
  slug: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdminVerticalSeriesEditSheet({
  slug,
  isOpen,
  onClose,
  onSuccess,
}: AdminVerticalSeriesEditSheetProps) {
  const { data: series, loading, error, reload } = useAdminQuery(
    () => fetchAdminVerticalSeriesDetail(slug),
    [slug],
  )

  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setDone(false)
      setSaveError(null)
      return
    }
    if (!series) return
    setTitle(series.title)
    setTagline(series.tagline)
    setDescription(series.description)
    setGenre(series.genre)
    setSaveError(null)
    setDone(false)
  }, [isOpen, series])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveError("Title is required.")
      return
    }

    setBusy(true)
    setSaveError(null)
    try {
      await updateAdminVerticalSeries(slug, {
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        genre: genre.trim(),
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
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg">Edit vertical series</h2>
            <p className="text-xs text-muted-foreground truncate">{slug}</p>
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
          {loading && !series ? (
            <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-10">{error}</p>
          ) : done ? (
            <div className="py-10 text-center">
              <Check className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="font-semibold">Series updated</p>
              <Button onClick={onClose} className="mt-6 rounded-full w-full">
                Done
              </Button>
            </div>
          ) : (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Series title *"
                className="w-full h-12 px-4 rounded-xl bg-secondary text-sm"
                maxLength={200}
              />
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Tagline"
                className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                maxLength={300}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Series description"
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-secondary text-sm resize-none"
                maxLength={5000}
              />
              <input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Genre"
                className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
                maxLength={80}
              />
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              <Button
                onClick={() => void handleSave()}
                disabled={busy}
                className="w-full rounded-full"
              >
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
