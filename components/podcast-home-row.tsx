"use client"

import Link from "next/link"
import { ChevronRight, Headphones } from "lucide-react"
import { videoThumbnail } from "@/lib/format-media"

export type PodcastHomeItem = {
  id: string
  title: string
  podcast: string
  cover: string
  duration: string
}

export function PodcastHomeRow({
  title,
  items,
  viewAllHref = "/podcasts",
}: {
  title: string
  items: PodcastHomeItem[]
  viewAllHref?: string
}) {
  if (!items.length) return null

  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Headphones className="w-5 h-5 text-purple-400" />
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
            key={item.id}
            href={`/podcast/${item.id}`}
            className="flex-shrink-0 w-40 group"
          >
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary mb-2">
              <img
                src={videoThumbnail(item.cover)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.podcast} · {item.duration}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
