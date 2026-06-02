"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Play, Clock } from "lucide-react"
import { Header } from "@/components/header"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Button } from "@/components/ui/button"
import { fetchVerticalSeries, type VerticalSeriesDetail } from "@/lib/api/verticals"
import { formatDuration, historyProgressPercent } from "@/lib/format-media"
import { getVerticalProgressForSeries } from "@/lib/vertical-progress"

export default function VerticalSeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [activeTab, setActiveTab] = useState("verticals")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [series, setSeries] = useState<VerticalSeriesDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resumeEpisode, setResumeEpisode] = useState<number | null>(null)
  const [resumePercent, setResumePercent] = useState(0)

  useEffect(() => {
    void fetchVerticalSeries(slug)
      .then((s) => {
        setSeries(s)
        const progress = getVerticalProgressForSeries(slug)
        if (progress) {
          setResumeEpisode(progress.episodeNumber)
          setResumePercent(
            historyProgressPercent(progress.progressSeconds, progress.durationSeconds),
          )
        }
      })
      .catch(() => setError("Series not found."))
  }, [slug])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center md:pl-20">
        <p>{error}</p>
      </main>
    )
  }

  if (!series) {
    return (
      <main className="min-h-screen flex items-center justify-center md:pl-20">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    )
  }

  const watchHref = (ep: number) => `/verticals/watch/${slug}/${ep}`
  const primaryEp = resumeEpisode ?? 1

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-6 md:py-10">
        <Link href="/verticals" className="text-sm text-primary mb-6 inline-block hover:underline">
          ← All verticals
        </Link>

        <div className="md:grid md:grid-cols-[minmax(280px,360px)_1fr] md:gap-12 md:items-start">
          {/* Poster column */}
          <div className="mb-8 md:mb-0 md:sticky md:top-24">
            <div className="aspect-[9/16] max-h-[520px] md:max-h-[640px] w-full max-w-sm mx-auto md:max-w-none rounded-2xl overflow-hidden border border-border shadow-xl">
              {series.posterUrl ? (
                <img src={series.posterUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary" />
              )}
            </div>
          </div>

          {/* Details column */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              Micro-drama · {series.genre ?? "Series"}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              {series.title}
            </h1>
            {series.tagline && (
              <p className="text-primary text-base md:text-lg mt-2 font-medium">{series.tagline}</p>
            )}
            <p className="text-muted-foreground text-sm md:text-base mt-4 leading-relaxed max-w-2xl">
              {series.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {series.totalEpisodes} episodes
              </span>
              {series.creator && (
                <Link
                  href={`/creator/${series.creator.username}`}
                  className="text-primary hover:underline"
                >
                  by {series.creator.displayName ?? series.creator.username}
                </Link>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link href={watchHref(primaryEp)} className="flex-1 sm:flex-none">
                <Button className="w-full sm:min-w-[200px] rounded-full" size="lg">
                  <Play className="w-5 h-5 fill-current mr-2" />
                  {resumeEpisode ? `Resume Ep ${resumeEpisode}` : "Watch Episode 1"}
                </Button>
              </Link>
              {resumeEpisode && resumeEpisode !== 1 && (
                <Link href={watchHref(1)}>
                  <Button variant="secondary" className="w-full rounded-full" size="lg">
                    From the beginning
                  </Button>
                </Link>
              )}
            </div>

            {resumeEpisode && resumePercent > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                You were {resumePercent}% through episode {resumeEpisode}
              </p>
            )}

            <h2 className="text-xl font-bold mt-10 mb-4">Episodes</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {series.episodes.map((ep) => (
                <li key={ep.id}>
                  <Link
                    href={watchHref(ep.episodeNumber)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-secondary/30 transition-colors h-full"
                  >
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                      {ep.episodeNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ep.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDuration(ep.durationSeconds)}
                        {ep.cliffhanger ? ` · ${ep.cliffhanger}` : ""}
                      </p>
                    </div>
                    <Play className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
