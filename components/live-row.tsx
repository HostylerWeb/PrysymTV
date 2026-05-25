"use client"

import { ChevronRight, Radio } from "lucide-react"
import { LiveCard } from "./live-card"

interface LiveStream {
  id: string
  title: string
  thumbnail: string
  streamer: string
  viewers: string
  category: string
  avatar?: string
}

interface LiveRowProps {
  title: string
  streams: LiveStream[]
  showViewAll?: boolean
}

export function LiveRow({ title, streams, showViewAll = true }: LiveRowProps) {
  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        {showViewAll && (
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Row */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {streams.map((stream) => (
          <div key={stream.id} className="snap-start">
            <LiveCard {...stream} />
          </div>
        ))}
      </div>
    </section>
  )
}
