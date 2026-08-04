"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Filter, Radio, Search, X } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { VideoCard } from "@/components/video-card"
import { LiveCard } from "@/components/live-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  FALLBACK_VIDEO_CATEGORIES,
  verticalForCategorySlug,
  type VideoBrowseMode,
  type VideoBrowseSort,
  type VideoCategory,
} from "@/lib/constants/video-categories"
import { fetchVideoCategories } from "@/lib/api/categories"
import { fetchVideosBrowse, type LiveBrowseItem } from "@/lib/api/videos-feed"
import type { VideoCard as ApiVideoCard } from "@/lib/api/feed"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"
import { userAvatarUrl } from "@/lib/user-avatar"
import { CreateFlowModals, triggerContextualCreate } from "@/components/create-flow-modals"
import { useCreateFlow } from "@/hooks/use-create-flow"
import { useAuth } from "@/contexts/auth-context"
import { VideosBrowseSkeleton } from "@/components/content-skeletons"

const MODE_OPTIONS: { id: VideoBrowseMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "videos", label: "Videos" },
  { id: "live", label: "Live" },
]

const SORT_OPTIONS: { id: VideoBrowseSort; label: string }[] = [
  { id: "views", label: "Popular" },
  { id: "newest", label: "Newest" },
]

function VideosBrowseContent() {
  const router = useRouter()
  const createFlow = useCreateFlow()
  const { user, isAuthenticated } = useAuth()
  const uploadVideo = () =>
    triggerContextualCreate("video", createFlow, { isAuthenticated, user })
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") ?? "all"

  const [activeTab, setActiveTab] = useState("videos")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [category, setCategory] = useState(initialCategory)
  const [mode, setMode] = useState<VideoBrowseMode>("all")
  const [sort, setSort] = useState<VideoBrowseSort>("views")
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [videos, setVideos] = useState<ApiVideoCard[]>([])
  const [liveItems, setLiveItems] = useState<LiveBrowseItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categories, setCategories] = useState<VideoCategory[]>(FALLBACK_VIDEO_CATEGORIES)

  useEffect(() => {
    void fetchVideoCategories()
      .then((res) =>
        setCategories([
          { slug: "all", label: "All", vertical: null },
          ...res.items.map((c) => ({
            slug: c.slug,
            label: c.label,
            vertical: c.vertical ?? null,
          })),
        ]),
      )
      .catch(() => setCategories(FALLBACK_VIDEO_CATEGORIES))
  }, [])

  const vertical = useMemo(
    () => verticalForCategorySlug(category, categories),
    [category, categories],
  )
  const hasMore = videos.length < total

  const loadFeed = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      try {
        const res = await fetchVideosBrowse({
          page: pageNum,
          limit: 24,
          vertical: vertical ?? undefined,
          sort,
          mode,
          q: searchQuery || undefined,
        })

        setLiveItems(res.live.items)
        setTotal(res.videos.meta.total)
        setVideos((prev) =>
          append ? [...prev, ...res.videos.items] : res.videos.items,
        )
        setPage(pageNum)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [vertical, sort, mode, searchQuery],
  )

  useEffect(() => {
    void loadFeed(1, false)
  }, [loadFeed])

  // Refresh just the live rail so hlsPlaybackUrl/thumbnail populate once the
  // stream is fully on-air, without resetting pagination or scroll position.
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchVideosBrowse({ page: 1, limit: 24, vertical: vertical ?? undefined, sort, mode, q: searchQuery || undefined })
        .then((res) => setLiveItems(res.live.items))
        .catch(() => {})
    }, 20_000)
    return () => clearInterval(interval)
  }, [vertical, sort, mode, searchQuery])

  useEffect(() => {
    const cat = searchParams.get("category")
    if (cat && cat !== category) setCategory(cat)
  }, [searchParams, category])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  const mapVideoRow = (v: ApiVideoCard) => ({
    id: v.id,
    title: v.title,
    thumbnail: videoThumbnail(v.thumbnailUrl),
    duration: formatDuration(v.durationSeconds),
    views: formatViewCount(v.viewsCount),
    channel: v.channel,
    channelAvatar: userAvatarUrl(v.channelAvatar, v.channelSlug ?? v.channel),
    type: "video" as const,
  })

  const showLiveSection = mode !== "videos" && liveItems.length > 0
  const showVideoGrid = mode !== "live"
  const emptyState =
    !loading &&
    ((mode === "live" && liveItems.length === 0) ||
      (mode === "videos" && videos.length === 0) ||
      (mode === "all" && videos.length === 0 && liveItems.length === 0))

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        onCreateClick={uploadVideo}
        createLabel="Upload video"
      />

      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Videos</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Long-form creator videos, live streams, and program categories
              </p>
            </div>
            <form onSubmit={onSearchSubmit} className="flex gap-2 w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search videos…"
                  className="w-full h-10 pl-9 pr-9 rounded-full bg-secondary/60 border border-border text-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                    onClick={() => {
                      setSearchInput("")
                      setSearchQuery("")
                    }}
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" className="rounded-full px-4 shrink-0">
                Search
              </Button>
            </form>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  category === cat.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-secondary/50 p-0.5">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                    mode === opt.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {opt.id === "live" && <Radio className="w-3 h-3" />}
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 text-xs font-medium"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <Filter className="w-3.5 h-3.5" />
              Sort
            </button>

            <div
              className={cn(
                "flex gap-1.5",
                filtersOpen ? "flex" : "hidden md:flex",
                "w-full md:w-auto",
              )}
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={mode === "live"}
                  onClick={() => setSort(opt.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    sort === opt.id
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary/40 text-muted-foreground",
                    mode === "live" && "opacity-40 cursor-not-allowed",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {searchQuery && (
              <span className="text-xs text-muted-foreground ml-auto">
                Results for &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {loading ? (
          <VideosBrowseSkeleton />
        ) : emptyState ? (
          <div className="text-center py-20 px-4">
            <p className="text-lg font-medium">No videos found</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Try another category, turn on Live, or upload long-form video from profile settings.
            </p>
          </div>
        ) : (
          <>
            {showLiveSection && (
              <section className="mb-10">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Live now
                </h2>
                <div className="min-w-0 w-full overflow-hidden">
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide overscroll-x-contain">
                  {liveItems.map((stream) => (
                    <LiveCard
                      key={stream.id}
                      id={stream.id}
                      slug={stream.slug}
                      title={stream.title}
                      thumbnail={stream.thumbnailUrl ?? undefined}
                      hlsPlaybackUrl={stream.hlsPlaybackUrl}
                      streamer={stream.streamer}
                      streamerSlug={stream.streamerSlug}
                      viewers={formatViewCount(stream.viewerCount)}
                      category={stream.category ?? stream.vertical ?? "Live"}
                      avatar={stream.streamerAvatar}
                      isPaid={stream.isPaid}
                      entryCoinCost={stream.entryCoinCost}
                    />
                  ))}
                  </div>
                </div>
              </section>
            )}

            {mode === "live" && liveItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {liveItems.map((stream) => (
                  <VideoCard
                    key={stream.id}
                    id={stream.slug}
                    title={stream.title}
                    thumbnail={stream.thumbnailUrl ?? ""}
                    hlsPlaybackUrl={stream.hlsPlaybackUrl}
                    streamerSlug={stream.streamerSlug}
                    streamerAvatar={stream.streamerAvatar}
                    channel={stream.streamer}
                    channelAvatar={userAvatarUrl(stream.streamerAvatar, stream.streamerSlug)}
                    isLive
                    isPaid={stream.isPaid}
                    entryCoinCost={stream.entryCoinCost}
                    liveViewers={`${formatViewCount(stream.viewerCount)} watching`}
                    type="live"
                    layout="grid"
                  />
                ))}
              </div>
            )}

            {showVideoGrid && videos.length > 0 && (
              <section>
                {mode === "all" && liveItems.length > 0 && (
                  <h2 className="text-lg font-semibold mb-4">Videos</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {videos.map((v) => (
                    <VideoCard key={v.id} {...mapVideoRow(v)} layout="grid" />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <Button
                      variant="outline"
                      className="rounded-full px-8"
                      disabled={loadingMore}
                      onClick={() => void loadFeed(page + 1, true)}
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} scope="video" />

      <CreateFlowModals
        flow={createFlow}
        onOpenSettings={() => router.push("/profile?settings=go-live")}
        onNeedCreatorVerification={() => router.push("/profile")}
      />
    </main>
  )
}

export default function VideosBrowsePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
          <Header onSearchClick={() => {}} />
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <VideosBrowseSkeleton />
          </div>
        </main>
      }
    >
      <VideosBrowseContent />
    </Suspense>
  )
}
