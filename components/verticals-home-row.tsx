"use client"

import Link from "next/link"
import { ChevronRight, Clapperboard } from "lucide-react"
import { videoThumbnail } from "@/lib/format-media"

export type VerticalHomeItem = {
  slug: string
  title: string
  posterUrl: string | null
  genre?: string
}

export function VerticalsHomeRow({
  title,
  items,
  viewAllHref = "/verticals",
}: {
  title: string
  items: VerticalHomeItem[]
  viewAllHref?: string
}) {
  if (!items.length) return null

  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clapperboard className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/verticals/${item.slug}`}
            className="flex-shrink-0 w-36 group"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-secondary mb-2">
              <img
                src={videoThumbnail(item.posterUrl)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
            {item.genre && (
              <p className="text-xs text-muted-foreground">{item.genre}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
