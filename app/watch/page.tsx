"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { fetchVideosBrowse } from "@/lib/api/videos-feed"
import type { VideoCard as ApiVideoCard } from "@/lib/api/feed"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"
import { userAvatarUrl } from "@/lib/user-avatar"
import { VideosBrowseSkeleton } from "@/components/content-skeletons"

export default function WatchBrowsePage() {
  return (
    <Suspense fallback={null}>
      <WatchBrowseContent />
    </Suspense>
  )
}

function WatchBrowseContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("videos")
  const [videos, setVideos] = useState<ApiVideoCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetchVideosBrowse({ page: 1, limit: 24, mode: "videos", sort: "views" })
      .then((res) => {
        if (!cancelled) setVideos(res.items)
      })
      .catch(() => {
        if (!cancelled) setVideos([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Watch</h1>
            <p className="text-muted-foreground mt-1">
              Browse long-form videos or open a direct link to a specific video.
            </p>
          </div>
          <Button asChild variant="secondary" className="rounded-full shrink-0">
            <Link href="/videos">Browse all videos</Link>
          </Button>
        </div>

        {loading ? (
          <VideosBrowseSkeleton />
        ) : videos.length === 0 ? (
          <p className="text-muted-foreground">No videos available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={videoThumbnail(video.thumbnailUrl)}
                channel={video.creatorName ?? "Creator"}
                channelAvatar={userAvatarUrl(video.creatorAvatarUrl, video.creatorName)}
                views={formatViewCount(video.viewsCount)}
                duration={formatDuration(video.durationSeconds)}
                type="video"
                layout="grid"
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          if (tab === "home") router.push("/")
          else if (tab === "shorts") router.push("/shorts")
          else if (tab === "videos") router.push("/videos")
          else if (tab === "profile") router.push("/profile")
        }}
      />
    </main>
  )
}
