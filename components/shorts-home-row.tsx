"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { videoThumbnail } from "@/lib/format-media"

export type ShortHomeItem = {
  id: string
  title: string
  thumbnail: string
  channel: string
}

export function ShortsHomeRow({
  title,
  items,
  viewAllHref = "/shorts",
}: {
  title: string
  items: ShortHomeItem[]
  viewAllHref?: string
}) {
  if (!items.length) return null

  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
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
            key={item.id}
            href="/shorts"
            className="flex-shrink-0 w-[120px] group"
          >
            <div className="aspect-[9/16] rounded-xl overflow-hidden bg-secondary mb-2">
              <img
                src={videoThumbnail(item.thumbnail)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-xs font-medium line-clamp-2">{item.title}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{item.channel}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
