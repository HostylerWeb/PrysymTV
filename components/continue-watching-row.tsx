"use client"

import Link from "next/link"
import { Play } from "lucide-react"
import { historyProgressPercent, videoThumbnail } from "@/lib/format-media"
import type { HistoryItemRecord } from "@/lib/api/types"
import type { VerticalProgressEntry } from "@/lib/vertical-progress"

type ContinueWatchingRowProps = {
  historyItems: HistoryItemRecord[]
  verticalItems: VerticalProgressEntry[]
}

export function ContinueWatchingRow({ historyItems, verticalItems }: ContinueWatchingRowProps) {
  const hasHistory = historyItems.length > 0 || verticalItems.length > 0
  if (!hasHistory) return null

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4 px-0">Continue Watching</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {verticalItems.map((v) => {
          const pct =
            v.durationSeconds > 0
              ? historyProgressPercent(v.progressSeconds, v.durationSeconds)
              : 0
          return (
            <Link
              key={`${v.slug}-${v.episodeNumber}`}
              href={`/verticals/watch/${v.slug}/${v.episodeNumber}`}
              className="flex-shrink-0 w-44 group"
            >
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-secondary">
                {v.posterUrl && (
                  <img src={v.posterUrl} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold line-clamp-2">
                  {v.seriesTitle} · Ep {v.episodeNumber}
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
        {historyItems.map((item) => {
          if (!item.video) return null
          const pct = historyProgressPercent(item.progressSeconds, item.video.durationSeconds)
          const href =
            item.contentType === "video" ? `/watch/${item.contentId}` : `/podcast/${item.contentId}`
          return (
            <Link key={item.contentId} href={href} className="flex-shrink-0 w-56 group">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
                <img
                  src={videoThumbnail(item.video.thumbnailUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium mt-2 line-clamp-1">{item.video.title}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
