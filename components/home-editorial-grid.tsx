"use client"

import Link from "next/link"
import { Play } from "lucide-react"
import { videoThumbnail } from "@/lib/format-media"

type EditorialVideo = {
  id: string
  title: string
  thumbnail: string
  channel: string
  views: string
}

type EditorialVertical = {
  slug: string
  title: string
  posterUrl: string | null
  genre?: string
}

type HomeEditorialGridProps = {
  spotlight: EditorialVideo | null
  verticals: EditorialVertical[]
}

export function HomeEditorialGrid({ spotlight, verticals }: HomeEditorialGridProps) {
  if (!spotlight && verticals.length === 0) return null

  return (
    <section className="py-6 md:py-8 min-w-0 overflow-hidden">
      <div className="flex items-start gap-3 px-4 md:px-8 mb-4">
        <span className="w-1 h-9 md:h-10 rounded-full bg-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Curated for you
          </p>
          <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
            Hand-picked across Prysym
          </h2>
        </div>
      </div>

      <div className="px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4 auto-rows-min">
          {spotlight && (
            <Link
              href={`/watch/${spotlight.id}`}
              className="col-span-2 lg:col-span-7 group relative overflow-hidden rounded-2xl border border-border/60 bg-card min-h-[220px] md:min-h-[340px]"
            >
              <img
                src={videoThumbnail(spotlight.thumbnail)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Trending now
                </p>
                <h3 className="text-xl md:text-2xl font-bold text-white line-clamp-2">
                  {spotlight.title}
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  {spotlight.channel} · {spotlight.views} views
                </p>
              </div>
              <div className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </div>
            </Link>
          )}

          {verticals.length > 0 && (
            <div
              className={
                spotlight
                  ? "col-span-2 lg:col-span-5 grid grid-cols-2 gap-3 md:gap-4"
                  : "col-span-2 lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
              }
            >
              {verticals.slice(0, spotlight ? 4 : 4).map((v) => (
                <Link
                  key={v.slug}
                  href={`/verticals/${v.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 aspect-[9/13] bg-card"
                >
                  <img
                    src={videoThumbnail(v.posterUrl)}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                  {v.genre && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide text-white bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      {v.genre}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-semibold text-white line-clamp-2">{v.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
