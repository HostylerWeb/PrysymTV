"use client"

import { useState } from "react"
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
import {
  mockVideos,
  mockMovies,
  mockLiveStreams,
  mockStories,
  type ContentCategory,
  type MockStory,
} from "@/lib/mock-data"

const continueWatching = mockVideos
  .filter((v) => v.progress)
  .map((v) => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail,
    duration: v.duration,
    progress: v.progress!,
    type: v.type === "movie" ? ("movie" as const) : ("video" as const),
  }))

const trendingVideos = mockVideos.map((v) => ({
  id: v.id,
  title: v.title,
  thumbnail: v.thumbnail,
  duration: v.duration,
  views: v.views,
  channel: v.channel,
  type: "video" as const,
}))

const topMovies = mockMovies.map((m) => ({
  id: m.id,
  title: m.title,
  poster: m.poster,
  year: m.year,
  rating: Number(m.rating),
  genre: m.genre,
}))

const liveStreams = mockLiveStreams.map((s) => ({
  id: s.id,
  slug: s.slug,
  title: s.title,
  thumbnail: s.thumbnail,
  streamer: s.streamer,
  viewers: s.viewers,
  category: s.category,
  avatar: s.streamerAvatar,
}))

const newReleases = mockMovies.slice(0, 5).map((m) => ({
  id: m.id,
  title: m.title,
  poster: m.poster,
  year: m.year,
  rating: Number(m.rating),
  genre: m.genre,
}))

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<ContentCategory>("all")
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeStory, setActiveStory] = useState<MockStory | null>(null)

  const showLive = activeCategory === "all" || activeCategory === "live"
  const showMovies = activeCategory === "all" || activeCategory === "movies"
  const showVideos = activeCategory === "all" || activeCategory === "videos" || activeCategory === "trending"
  const showSeries = activeCategory === "all" || activeCategory === "series"

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <FeaturedLive />
      <AdBanner />

      <div className="relative z-10 bg-background">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-0">
          <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

          {showLive && <LiveRow title="Live Now" streams={liveStreams} />}

          {activeCategory === "all" && (
            <StoriesRow stories={mockStories} onStoryClick={setActiveStory} />
          )}

          {(activeCategory === "all" || activeCategory === "videos") && continueWatching.length > 0 && (
            <ContentRow title="Continue Watching" items={continueWatching} />
          )}

          {showVideos && <ContentRow title="Trending Videos" items={trendingVideos} />}

          {showMovies && (
            <>
              <MovieRow title="New Releases" movies={newReleases} />
              <MovieRow title="Top Movies on Prysym TV" movies={topMovies} />
            </>
          )}

          {showSeries && (
            <ContentRow
              title="Series & Shows"
              items={mockVideos.filter((v) => v.category === "series").map((v) => ({
                id: v.id,
                title: v.title,
                thumbnail: v.thumbnail,
                duration: v.duration,
                views: v.views,
                channel: v.channel,
                type: "video" as const,
              }))}
            />
          )}

          {activeCategory === "all" && (
            <ContentRow title="Recommended Channels" items={trendingVideos.slice(0, 4)} />
          )}
        </div>
      </div>

      <Footer />
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
    </main>
  )
}
