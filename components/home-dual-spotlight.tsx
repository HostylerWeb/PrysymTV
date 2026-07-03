"use client"

import Link from "next/link"
import { ChevronRight, Headphones, Smartphone } from "lucide-react"
import { videoThumbnail } from "@/lib/format-media"
import type { ShortHomeItem } from "@/components/shorts-home-row"
import type { PodcastHomeItem } from "@/components/podcast-home-row"

type HomeDualSpotlightProps = {
  shorts: ShortHomeItem[]
  podcasts: PodcastHomeItem[]
}

export function HomeDualSpotlight({ shorts, podcasts }: HomeDualSpotlightProps) {
  if (!shorts.length && !podcasts.length) return null

  return (
    <section className="py-6 md:py-8 border-t border-border/40">
      <div className="grid md:grid-cols-2 gap-8 px-4 md:px-8">
        {shorts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <h2 className="text-base font-semibold">Shorts</h2>
              </div>
              <Link
                href="/shorts"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                See all
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {shorts.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={`/shorts/${item.id}`}
                  className="shrink-0 w-[100px] group"
                >
                  <div className="aspect-[9/16] rounded-xl overflow-hidden bg-secondary border border-border/40">
                    <img
                      src={videoThumbnail(item.thumbnail)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] font-medium mt-1.5 line-clamp-2">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {podcasts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-semibold">Podcasts</h2>
              </div>
              <Link
                href="/podcasts"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                See all
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {podcasts.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/podcast/${item.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors group"
                >
                  <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={videoThumbnail(item.cover)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.podcast} · {item.duration}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
