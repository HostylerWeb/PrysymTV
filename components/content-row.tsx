"use client"

import { ChevronRight } from "lucide-react"
import { VideoCard } from "./video-card"
import { useRef } from "react"
import Link from "next/link"

export interface ContentItem {
  id: string
  title: string
  thumbnail: string
  duration?: string
  views?: string
  channel?: string
  isLive?: boolean
  liveViewers?: string
  type: "movie" | "video" | "live"
  progress?: number
}

interface ContentRowProps {
  title: string
  items: ContentItem[]
  showViewAll?: boolean
  viewAllHref?: string
  hideHeader?: boolean
}

export function ContentRow({
  title,
  items,
  showViewAll = true,
  viewAllHref,
  hideHeader = false,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section className="py-2">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 md:px-8 mb-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {showViewAll &&
            (viewAllHref ? (
              <Link
                href={viewAllHref}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex gap-3 px-4 md:px-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start">
            <VideoCard id={item.id} {...item} />
          </div>
        ))}
      </div>
    </section>
  )
}
