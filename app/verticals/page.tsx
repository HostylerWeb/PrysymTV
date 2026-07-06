"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { fetchVerticalSeriesList, type VerticalSeriesCard } from "@/lib/api/verticals"
import { Smartphone } from "lucide-react"
import { CreateFlowModals, triggerContextualCreate } from "@/components/create-flow-modals"
import { useCreateFlow } from "@/hooks/use-create-flow"
import { useAuth } from "@/contexts/auth-context"
import { VerticalsPageSkeleton } from "@/components/content-skeletons"

export default function VerticalsPage() {
  const createFlow = useCreateFlow()
  const { user, isAuthenticated, refreshUser } = useAuth()
  const createVertical = () =>
    triggerContextualCreate("vertical", createFlow, {
      isAuthenticated,
      user,
      verticalIntent: "add_episode",
    })
  const [activeTab, setActiveTab] = useState("verticals")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [series, setSeries] = useState<VerticalSeriesCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetchVerticalSeriesList()
      .then((res) => {
        if (!cancelled) setSeries(res.items)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-0 md:pl-20">
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        onCreateClick={createVertical}
        createLabel="Add vertical episode"
      />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-8 h-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Verticals</h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-2xl">
          Pocket-sized dramas you watch in portrait. Each episode is a few minutes, ends on a hook,
          and pulls you straight into the next one.
        </p>

        {loading ? (
          <VerticalsPageSkeleton />
        ) : series.length === 0 ? (
          <p className="text-muted-foreground">No series published yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {series.map((s) => (
              <Link key={s.id} href={`/verticals/${s.slug}`} className="group">
                <div className="aspect-[9/16] rounded-xl overflow-hidden border border-border bg-secondary/30 relative">
                  {s.posterUrl ? (
                    <img
                      src={s.posterUrl}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      9:16
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 right-2 text-[10px] font-medium bg-black/60 text-white px-2 py-1 rounded">
                    {s.totalEpisodes} eps
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold line-clamp-2">{s.title}</p>
                {s.tagline && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{s.tagline}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} scope="vertical" />
      <CreateFlowModals
        flow={createFlow}
        onUploadSuccess={() => void refreshUser()}
        onNeedCreatorVerification={() => createFlow.setUnlockOpen(true)}
      />
    </main>
  )
}
