"use client"

import Link from "next/link"
import { Play } from "lucide-react"
import { historyProgressPercent, videoThumbnail } from "@/lib/format-media"
import { isContinueWatchingHistoryItem } from "@/lib/continue-watching"
import type { ContinueWatchingFeedItem, HistoryItemRecord } from "@/lib/api/types"
import type { VerticalProgressEntry } from "@/lib/vertical-progress"

type ContinueWatchingRowProps = {
  feedItems?: ContinueWatchingFeedItem[]
  historyItems: HistoryItemRecord[]
  /** Guest-only local vertical progress (logged-in users use API feed). */
  verticalItems?: VerticalProgressEntry[]
}

function feedItemHref(item: ContinueWatchingFeedItem): string {
  if (item.contentType === "video") {
    if (item.videoType === "movie") return `/movie/${item.contentId}`
    return `/watch/${item.contentId}`
  }
  if (item.seriesSlug != null && item.episodeNumber != null) {
    return `/verticals/watch/${item.seriesSlug}/${item.episodeNumber}`
  }
  return `/verticals`
}

function VerticalCard({
  href,
  posterUrl,
  title,
  subtitle,
  pct,
}: {
  href: string
  posterUrl: string | null
  title: string
  subtitle: string
  pct: number
}) {
  return (
    <Link key={href} href={href} className="flex-shrink-0 w-44 group">
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-secondary">
        {posterUrl && (
          <img src={videoThumbnail(posterUrl)} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold line-clamp-2">
          {subtitle || title}
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ContinueWatchingRow({
  feedItems = [],
  historyItems,
  verticalItems = [],
}: ContinueWatchingRowProps) {
  const hasFeed = feedItems.length > 0
  const eligibleHistory = historyItems.filter(isContinueWatchingHistoryItem)
  const hasHistory = eligibleHistory.length > 0 || verticalItems.length > 0

  if (!hasFeed && !hasHistory) return null

  return (
    <section className="mb-8 min-w-0 overflow-hidden">
      <h2 className="text-lg font-bold text-foreground mb-4 px-0">Continue Watching</h2>
      <div className="min-w-0 w-full overflow-hidden">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 overscroll-x-contain">
        {!hasFeed &&
          verticalItems.map((v) => {
            const pct =
              v.durationSeconds > 0
                ? historyProgressPercent(v.progressSeconds, v.durationSeconds)
                : 0
            return (
              <VerticalCard
                key={`${v.slug}-${v.episodeNumber}`}
                href={`/verticals/watch/${v.slug}/${v.episodeNumber}`}
                posterUrl={v.posterUrl}
                title={v.seriesTitle}
                subtitle={`${v.seriesTitle} · Ep ${v.episodeNumber}`}
                pct={pct}
              />
            )
          })}

        {hasFeed
          ? feedItems.map((item) => {
              const pct = historyProgressPercent(
                item.progressSeconds,
                item.durationSeconds,
              )
              const href = feedItemHref(item)
              if (item.contentType === "vertical_episode") {
                return (
                  <VerticalCard
                    key={`${item.contentType}-${item.contentId}`}
                    href={href}
                    posterUrl={item.thumbnailUrl}
                    title={item.title}
                    subtitle={item.subtitle ?? item.title}
                    pct={pct}
                  />
                )
              }
              return (
                <Link
                  key={`${item.contentType}-${item.contentId}`}
                  href={href}
                  className="flex-shrink-0 w-56 group"
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
                    <img
                      src={videoThumbnail(item.thumbnailUrl)}
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
                  <p className="text-sm font-medium mt-2 line-clamp-1">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</p>
                  )}
                </Link>
              )
            })
          : eligibleHistory.map((item) => {
              if (item.video) {
                const pct = historyProgressPercent(
                  item.progressSeconds,
                  item.video.durationSeconds,
                )
                const href =
                  item.video.type === "movie"
                    ? `/movie/${item.contentId}`
                    : `/watch/${item.contentId}`
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
              }
              if (item.verticalEpisode) {
                const ep = item.verticalEpisode
                const pct = historyProgressPercent(item.progressSeconds, ep.durationSeconds)
                return (
                  <VerticalCard
                    key={item.contentId}
                    href={`/verticals/watch/${ep.series.slug}/${ep.episodeNumber}`}
                    posterUrl={ep.thumbnailUrl ?? ep.series.posterUrl}
                    title={ep.title}
                    subtitle={`${ep.series.title} · Ep ${ep.episodeNumber}`}
                    pct={pct}
                  />
                )
              }
              return null
            })}
        </div>
      </div>
    </section>
  )
}
