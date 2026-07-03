"use client"

import Link from "next/link"
import { Play } from "lucide-react"

export type TrendingRailItem = {
  id: string
  title: string
  thumbnail: string
  duration?: string
  views?: string
  channel?: string
}

type HomeTrendingRailProps = {
  items: TrendingRailItem[]
}

export function HomeTrendingRail({ items }: HomeTrendingRailProps) {
  if (items.length === 0) return null

  return (
    <div className="min-w-0 w-full overflow-hidden">
      <div className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide pb-2 overscroll-x-contain px-4 md:px-8">
      {items.slice(0, 10).map((item, index) => (
        <Link
          key={item.id}
          href={`/watch/${item.id}`}
          className="group relative flex items-end shrink-0 pl-3 md:pl-4"
        >
          <span
            aria-hidden="true"
            className="select-none font-black leading-[0.8] text-[64px] md:text-[84px] shrink-0 -mr-3 md:-mr-5 pb-1"
            style={{
              WebkitTextStroke: "2px var(--border)",
              color: "transparent",
            }}
          >
            {index + 1}
          </span>
          <div className="relative z-10 w-[168px] md:w-[200px] shrink-0">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2 ring-1 ring-border/60 group-hover:ring-primary/50 transition-all">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-foreground/90 flex items-center justify-center">
                  <Play className="w-4 h-4 text-background fill-background ml-0.5" />
                </div>
              </div>
              {item.duration && (
                <span className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-foreground text-[11px] font-medium px-1.5 py-0.5 rounded">
                  {item.duration}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {item.channel && <span className="truncate">{item.channel}</span>}
              {item.channel && item.views && <span>·</span>}
              {item.views && <span className="shrink-0">{item.views} views</span>}
            </div>
          </div>
        </Link>
      ))}
      </div>
    </div>
  )
}
