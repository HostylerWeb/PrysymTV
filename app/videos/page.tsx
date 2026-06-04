"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { VideoCard } from "@/components/video-card"
import { fetchFeedTrending } from "@/lib/api/feed"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"

export default function VideosBrowsePage() {
  const [items, setItems] = useState<
    Array<{
      id: string
      title: string
      thumbnail: string
      duration: string
      views: string
      channel: string
      type: "video" | "movie"
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [navTab, setNavTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    void fetchFeedTrending(1, 48)
      .then((res) => {
        setItems(
          res.items
            .filter((v) => v.type === "video" || v.type === "short")
            .map((v) => ({
              id: v.id,
              title: v.title,
              thumbnail: videoThumbnail(v.thumbnailUrl),
              duration: formatDuration(v.durationSeconds),
              views: formatViewCount(v.viewsCount),
              channel: v.channel,
              type: v.type === "movie" ? "movie" as const : "video" as const,
            })),
        )
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Home
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Videos</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Trending long-form and clips from creators on Prysym TV.
        </p>

        {loading ? (
          <p className="text-muted-foreground text-center py-20">Loading videos…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">No videos yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <VideoCard key={item.id} {...item} />
            ))}
          </div>
        )}
      </div>
      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
