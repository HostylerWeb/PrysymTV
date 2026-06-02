"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Button } from "@/components/ui/button"
import { fetchVerticalSeries, type VerticalSeriesDetail } from "@/lib/api/verticals"
import { formatDuration } from "@/lib/format-media"

export default function VerticalSeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [activeTab, setActiveTab] = useState("verticals")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [series, setSeries] = useState<VerticalSeriesDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchVerticalSeries(slug)
      .then(setSeries)
      .catch(() => setError("Series not found."))
  }, [slug])

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>{error}</p>
      </main>
    )
  }

  if (!series) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link href="/verticals" className="text-sm text-primary mb-4 inline-block">
          ← All verticals
        </Link>
        <div className="aspect-[9/16] max-h-[420px] w-full mx-auto rounded-2xl overflow-hidden border border-border mb-6">
          {series.posterUrl && (
            <img src={series.posterUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <h1 className="text-2xl font-bold">{series.title}</h1>
        {series.tagline && <p className="text-primary text-sm mt-1">{series.tagline}</p>}
        <p className="text-muted-foreground text-sm mt-3">{series.description}</p>
        <Link href={`/verticals/watch/${slug}/1`} className="block mt-6">
          <Button className="w-full rounded-full" size="lg">
            Watch Episode 1
          </Button>
        </Link>

        <h2 className="text-lg font-semibold mt-8 mb-3">Episodes</h2>
        <ul className="space-y-2">
          {series.episodes.map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/verticals/watch/${slug}/${ep.episodeNumber}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40"
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {ep.episodeNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{ep.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(ep.durationSeconds)}
                    {ep.cliffhanger ? ` · ${ep.cliffhanger}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
