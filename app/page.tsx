"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { FeaturedLive } from "@/components/featured-live"
import { CategoryTabs } from "@/components/category-tabs"
import { StoriesRow } from "@/components/stories-row"
import { ContentRow } from "@/components/content-row"
import { MovieRow } from "@/components/movie-row"
import { LiveRow } from "@/components/live-row"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Footer } from "@/components/footer"
import { AdBanner } from "@/components/ad-banner"
import { StoryViewer } from "@/components/story-viewer"
import { fetchFeedHome } from "@/lib/api/feed"
import { formatDuration, formatViewCount } from "@/lib/format-media"
import { mockStories, type ContentCategory, type MockStory } from "@/lib/mock-data"

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>("all")
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeStory, setActiveStory] = useState<MockStory | null>(null)
  const [liveStreams, setLiveStreams] = useState<
    Array<{
      id: string
      slug: string
      title: string
      thumbnail: string
      streamer: string
      viewers: string
      category: string
      avatar: string | null
    }>
  >([])
  const [trendingVideos, setTrendingVideos] = useState<
    Array<{
      id: string
      title: string
      thumbnail: string
      duration: string
      views: string
      channel: string
      type: "video"
    }>
  >([])
  const [topMovies, setTopMovies] = useState<
    Array<{ id: string; title: string; poster: string; year: string; rating: number; genre: string }>
  >([])
  const [newReleases, setNewReleases] = useState<typeof topMovies>([])

  useEffect(() => {
    void fetchFeedHome().then((feed) => {
      setLiveStreams(
        feed.liveNow.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          thumbnail: s.thumbnailUrl ?? "",
          streamer: s.streamer,
          viewers: String(s.viewers),
          category: s.category ?? "Live",
          avatar: s.streamerAvatar,
        })),
      )
      setTrendingVideos(
        feed.trending.map((v) => ({
          id: v.id,
          title: v.title,
          thumbnail: v.thumbnailUrl ?? "",
          duration: formatDuration(v.durationSeconds),
          views: formatViewCount(v.viewsCount),
          channel: v.channel,
          type: "video" as const,
        })),
      )
      const movies = feed.movies.map((m) => ({
        id: m.id,
        title: m.title,
        poster: m.thumbnailUrl ?? "",
        year: String(m.releaseYear ?? new Date().getFullYear()),
        rating: 8,
        genre: m.category ?? "Movie",
      }))
      setTopMovies(movies)
      setNewReleases(
        feed.newReleases.map((m) => ({
          id: m.id,
          title: m.title,
          poster: m.thumbnailUrl ?? "",
          year: String(new Date().getFullYear()),
          rating: 8,
          genre: m.category ?? "Movie",
        })),
      )
    })
  }, [])

  const showLive = activeCategory === "all" || activeCategory === "live"
  const showMovies = activeCategory === "all" || activeCategory === "movies"
  const showVideos = activeCategory === "all" || activeCategory === "videos" || activeCategory === "trending"

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <FeaturedLive />
      <AdBanner />

      <div className="relative z-10 bg-background">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-0">
          <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

          {showLive && liveStreams.length > 0 && (
            <LiveRow title="Live Now" streams={liveStreams} />
          )}

          {activeCategory === "all" && (
            <StoriesRow stories={mockStories} onStoryClick={setActiveStory} />
          )}

          {showVideos && trendingVideos.length > 0 && (
            <ContentRow title="Trending Videos" items={trendingVideos} />
          )}

          {showMovies && topMovies.length > 0 && (
            <>
              {newReleases.length > 0 && (
                <MovieRow title="New Releases" movies={newReleases} />
              )}
              <MovieRow title="Top Movies on Prysym TV" movies={topMovies} />
            </>
          )}

          {activeCategory === "all" && trendingVideos.length > 0 && (
            <ContentRow title="Recommended" items={trendingVideos.slice(0, 4)} />
          )}
        </div>
      </div>

      <Footer />
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
    </main>
  )
}
