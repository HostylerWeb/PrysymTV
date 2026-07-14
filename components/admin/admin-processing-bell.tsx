"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Clapperboard, Film, Headphones, LayoutGrid, Loader2, Video } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fetchAdminOverview, fetchAdminProcessingContent } from "@/lib/api/admin"
import type { AdminProcessingItem } from "@/lib/api/admin"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function kindIcon(kind: string) {
  switch (kind) {
    case "movie":
      return Clapperboard
    case "short":
      return Video
    case "vertical_episode":
      return LayoutGrid
    case "podcast_episode":
      return Headphones
    default:
      return Film
  }
}

function ProcessingRow({ item }: { item: AdminProcessingItem }) {
  const Icon = kindIcon(item.kind)
  return (
    <Link
      href={item.adminHref}
      className="flex items-start gap-3 rounded-xl border border-border p-3 hover:bg-secondary/40 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.label}
          {item.seriesTitle ? ` · ${item.seriesTitle}` : ""}
          {item.episodeNumber != null ? ` · Ep ${item.episodeNumber}` : ""}
          {item.creator ? ` · ${item.creator}` : ""}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          {item.stage === "awaiting_upload" ? "Awaiting upload" : "Transcoding"} ·{" "}
          {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
        </p>
      </div>
    </Link>
  )
}

export function AdminProcessingBell({ className }: { className?: string }) {
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<AdminProcessingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const refresh = async () => {
    try {
      const [overview, processing] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminProcessingContent(15),
      ])
      setCount(overview.processingTotal ?? 0)
      setItems(processing.items)
    } catch {
      setCount(0)
      setItems([])
    }
  }

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    void refresh().finally(() => setLoading(false))
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative w-10 h-10 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center",
            className,
          )}
          aria-label={
            count > 0
              ? `${count} item${count === 1 ? "" : "s"} processing`
              : "Processing queue"
          }
        >
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Processing queue</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {loading && items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              Loading processing items…
            </div>
          ) : count === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground px-4">
              Nothing is processing right now. New uploads will show up here while
              they transcode.
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground px-1">
                {count} item{count === 1 ? "" : "s"} transcoding in the background.
                You can keep uploading — they'll publish automatically when ready.
              </p>
              {items.map((item) => (
                <ProcessingRow key={`${item.kind}-${item.id}`} item={item} />
              ))}
              <Link
                href="/admin/content/videos?status=processing"
                onClick={() => setOpen(false)}
                className="block text-center text-sm text-primary hover:underline py-2"
              >
                View all in Content library
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
