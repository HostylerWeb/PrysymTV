"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { FeaturedLive, type FeaturedLiveStream } from "@/components/featured-live"
import { ContinueWatchingRow } from "@/components/continue-watching-row"
import { filterContinueWatchingFeed, filterContinueWatchingHistory } from "@/lib/continue-watching"
import { useAuth } from "@/contexts/auth-context"
import { fetchHistory } from "@/lib/api/history"
import { listVerticalContinueWatching } from "@/lib/vertical-progress"
import type { ContinueWatchingFeedItem, HistoryItemRecord } from "@/lib/api/types"
import { CategoryTabs } from "@/components/category-tabs"
import { ContentRow } from "@/components/content-row"
import { MovieRow } from "@/components/movie-row"
import { LiveRow } from "@/components/live-row"
import { ShortsHomeRow } from "@/components/shorts-home-row"
import { PodcastHomeRow } from "@/components/podcast-home-row"
import { VerticalsHomeRow } from "@/components/verticals-home-row"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Footer } from "@/components/footer"
import { AdBanner } from "@/components/ad-banner"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { fetchFeedHome } from "@/lib/api/feed"
import { fetchShortsFeed } from "@/lib/api/videos-feed"
import { fetchPodcastEpisodesFeed } from "@/lib/api/podcasts"
import { fetchVerticalSeriesList } from "@/lib/api/verticals"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"

type ContentCategory = "all" | "movies" | "live" | "videos" | "series" | "trending"

export default function Home() {
  const { isAuthenticated } = useAuth()
  const { platformCreatorId } = usePublicAdsConfig()
  const [activeCategory, setActiveCategory] = useState<ContentCategory>("all")
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [homeShorts, setHomeShorts] = useState<
    Array<{ id: string; title: string; thumbnail: string; channel: string }>
  >([])
  const [homePodcasts, setHomePodcasts] = useState<
    Array<{ id: string; title: string; podcast: string; cover: string; duration: string }>
  >([])
  const [homeVerticals, setHomeVerticals] = useState<
    Array<{ slug: string; title: string; posterUrl: string | null; genre?: string }>
  >([])
  const [liveStreams, setLiveStreams] = useState<
    Array<{
      id: string
      slug: string
      title: string
      thumbnail: string
      hlsPlaybackUrl: string | null
      streamer: string
      streamerSlug: string
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
  const [featuredLive, setFeaturedLive] = useState<FeaturedLiveStream | null>(null)
  const [continueFeed, setContinueFeed] = useState<ContinueWatchingFeedItem[]>([])
  const [continueHistory, setContinueHistory] = useState<HistoryItemRecord[]>([])
  const [guestVertical, setGuestVertical] = useState(
    () => (typeof window !== "undefined" ? listVerticalContinueWatching() : []),
  )

  useEffect(() => {
    if (!isAuthenticated) setGuestVertical(listVerticalContinueWatching())
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setContinueHistory([])
      return
    }
    void fetchHistory(1, 8)
      .then((res) =>
        setContinueHistory(filterContinueWatchingHistory(res.items)),
      )
      .catch(() => setContinueHistory([]))
  }, [isAuthenticated])

  useEffect(() => {
    void fetchFeedHome().then((feed) => {
      setContinueFeed(filterContinueWatchingFeed(feed.continueWatching ?? []))
      if (feed.featuredLive) {
        setFeaturedLive({
          id: feed.featuredLive.id,
          slug: feed.featuredLive.slug,
          title: feed.featuredLive.title,
          thumbnailUrl: feed.featuredLive.thumbnailUrl,
          hlsPlaybackUrl: feed.featuredLive.hlsPlaybackUrl,
          streamer: feed.featuredLive.streamer,
          streamerAvatar: feed.featuredLive.streamerAvatar,
          viewerCount: feed.featuredLive.viewerCount,
        })
      }
      setLiveStreams(
        feed.liveNow.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          thumbnail: s.thumbnailUrl ?? "",
          hlsPlaybackUrl: s.hlsPlaybackUrl,
          streamer: s.streamer,
          streamerSlug: s.streamerSlug,
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
      const mapMovie = (m: (typeof feed.movies)[number]) => ({
        id: m.id,
        title: m.title,
        poster: videoThumbnail(m.thumbnailUrl),
        year: String(m.releaseYear ?? new Date().getFullYear()),
        rating: m.likesCount ?? 0,
        genre: m.category ?? "Movie",
      })
      setTopMovies(feed.movies.map(mapMovie))
      setNewReleases(feed.newReleases.map(mapMovie))
    })
  }, [])

  useEffect(() => {
    void fetchShortsFeed().then((res) => {
      setHomeShorts(
        res.items.slice(0, 10).map((s) => ({
          id: s.id,
          title: s.title,
          thumbnail: videoThumbnail(s.thumbnailUrl),
          channel: s.channel,
        })),
      )
    })
    void fetchPodcastEpisodesFeed(1, 10).then((res) => {
      setHomePodcasts(
        res.items.map((ep) => ({
          id: ep.id,
          title: ep.title,
          podcast: ep.podcast,
          cover: ep.cover,
          duration: ep.duration,
        })),
      )
    })
    void fetchVerticalSeriesList().then((res) => {
      setHomeVerticals(
        res.items.slice(0, 10).map((s) => ({
          slug: s.slug,
          title: s.title,
          posterUrl: s.posterUrl,
          genre: s.genre,
        })),
      )
    })
  }, [])

  const showLive = activeCategory === "all" || activeCategory === "live"
  const showMovies = activeCategory === "all" || activeCategory === "movies"
  const showVideos = activeCategory === "all" || activeCategory === "videos" || activeCategory === "trending"
  const showSeries = activeCategory === "all" || activeCategory === "series"

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <FeaturedLive stream={featuredLive} />
      <AdBanner platformCreatorId={platformCreatorId} />

      <div className="relative z-10 bg-background">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-0">
          <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

          {(continueFeed.length > 0 ||
            guestVertical.length > 0 ||
            continueHistory.length > 0) && (
            <div className="px-4 md:px-8 pt-4">
              <ContinueWatchingRow
                feedItems={continueFeed}
                historyItems={continueFeed.length > 0 ? [] : continueHistory}
                verticalItems={isAuthenticated ? [] : guestVertical}
              />
            </div>
          )}

          {showLive && liveStreams.length > 0 && (
            <LiveRow title="Live Now" streams={liveStreams} />
          )}

          {showSeries && (
            <VerticalsHomeRow title="Micro-dramas & Series" items={homeVerticals} />
          )}

          {activeCategory === "all" && homeShorts.length > 0 && (
            <ShortsHomeRow title="Shorts" items={homeShorts} />
          )}

          {activeCategory === "all" && homePodcasts.length > 0 && (
            <PodcastHomeRow title="Podcasts" items={homePodcasts} />
          )}

          {showVideos && trendingVideos.length > 0 && (
            <ContentRow
              title="Trending Videos"
              items={trendingVideos}
              viewAllHref="/videos"
            />
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
    </main>
  )
}
