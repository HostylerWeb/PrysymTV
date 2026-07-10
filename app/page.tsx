"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { MovieRow } from "@/components/movie-row"
import { LiveRow } from "@/components/live-row"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Footer } from "@/components/footer"
import { AdBanner } from "@/components/ad-banner"
import { HomeHero, type HomeFeaturedMovie } from "@/components/home-hero"
import { HomeEditorialGrid } from "@/components/home-editorial-grid"
import { HomeDualSpotlight } from "@/components/home-dual-spotlight"
import { HomeSectionShell } from "@/components/home-section-shell"
import { HomeTrendingRail } from "@/components/home-trending-rail"
import { HomeFeedSkeleton, HomeDualSpotlightSkeleton } from "@/components/content-skeletons"
import { FeedErrorBanner } from "@/components/feed-error-banner"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { fetchFeedHomeResult } from "@/lib/api/feed"
import { fetchShortsFeed } from "@/lib/api/videos-feed"
import { fetchPodcastEpisodesFeed } from "@/lib/api/podcasts"
import { fetchVerticalSeriesList } from "@/lib/api/verticals"
import { formatDuration, formatViewCount, moviePosterUrl, videoThumbnail } from "@/lib/format-media"

export default function Home() {
  const { platformCreatorId } = usePublicAdsConfig()
  const [activeTab, setActiveTab] = useState("none")
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
  const [heroSlides, setHeroSlides] = useState<HomeFeaturedMovie[]>([])
  const [feedReady, setFeedReady] = useState(false)
  const [extrasReady, setExtrasReady] = useState(false)
  const [feedError, setFeedError] = useState(false)
  const [feedReloadKey, setFeedReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setFeedReady(false)
    setFeedError(false)
    void fetchFeedHomeResult()
      .then(({ data: feed, fromFallback }) => {
        if (cancelled) return
        if (fromFallback) {
          setFeedError(true)
          return
        }
      const slides: HomeFeaturedMovie[] = []
      const seenSlideIds = new Set<string>()
      if (feed.featuredMovie && feed.heroMovieReason) {
        slides.push({
          id: feed.featuredMovie.id,
          title: feed.featuredMovie.title,
          poster: moviePosterUrl(feed.featuredMovie),
          genre: feed.featuredMovie.category ?? "Movie",
          year: String(feed.featuredMovie.releaseYear ?? new Date().getFullYear()),
          channel: feed.featuredMovie.channel,
          reason: feed.heroMovieReason,
        })
        seenSlideIds.add(feed.featuredMovie.id)
      }
      for (const m of feed.movies) {
        if (slides.length >= 4) break
        if (seenSlideIds.has(m.id)) continue
        seenSlideIds.add(m.id)
        slides.push({
          id: m.id,
          title: m.title,
          poster: moviePosterUrl(m),
          genre: m.category ?? "Movie",
          year: String(m.releaseYear ?? new Date().getFullYear()),
          channel: m.channel,
          reason: "trending",
        })
      }
      setHeroSlides(slides)
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
        poster: moviePosterUrl(m),
        year: String(m.releaseYear ?? new Date().getFullYear()),
        rating: m.likesCount ?? 0,
        genre: m.category ?? "Movie",
      })
      setTopMovies(feed.movies.map(mapMovie))
      setNewReleases(feed.newReleases.map(mapMovie))
    })
      .finally(() => {
        if (!cancelled) setFeedReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [feedReloadKey])

  useEffect(() => {
    void Promise.all([
      fetchShortsFeed().then((res) => {
        setHomeShorts(
          res.items.slice(0, 10).map((s) => ({
            id: s.id,
            title: s.title,
            thumbnail: videoThumbnail(s.thumbnailUrl),
            channel: s.channel,
          })),
        )
      }),
      fetchPodcastEpisodesFeed(1, 10).then((res) => {
        setHomePodcasts(
          res.items.map((ep) => ({
            id: ep.id,
            title: ep.title,
            podcast: ep.podcast,
            cover: ep.cover,
            duration: ep.duration,
          })),
        )
      }),
      fetchVerticalSeriesList().then((res) => {
        setHomeVerticals(
          res.items.slice(0, 10).map((s) => ({
            slug: s.slug,
            title: s.title,
            posterUrl: s.posterUrl,
            genre: s.genre ?? undefined,
          })),
        )
      }),
    ]).finally(() => setExtrasReady(true))
  }, [])

  const top10Items = trendingVideos.slice(0, 10)
  const spotlightVideo =
    trendingVideos.length > 10 ? trendingVideos[10] : (trendingVideos[0] ?? null)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20 overflow-x-hidden">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      {feedError ? (
        <div className="px-4 md:px-8 pt-4">
          <FeedErrorBanner onRetry={() => setFeedReloadKey((k) => k + 1)} />
        </div>
      ) : null}

      <HomeHero slides={heroSlides} loading={!feedReady} />

      <div className="max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
        <div className="px-4 md:px-8">
          <AdBanner platformCreatorId={platformCreatorId} />
        </div>

        {!feedReady ? (
          <HomeFeedSkeleton />
        ) : (
          <>
            {top10Items.length > 0 && (
              <HomeSectionShell eyebrow="Popular" title="Top 10 today" href="/videos">
                <HomeTrendingRail items={top10Items} />
              </HomeSectionShell>
            )}

            {liveStreams.length > 0 && (
              <HomeSectionShell
                id="live-now"
                eyebrow="Broadcasting"
                title="Live right now"
                badge={
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {liveStreams.length} live
                  </span>
                }
              >
                <p className="px-4 md:px-8 text-xs text-muted-foreground -mt-2 mb-3">
                  Creators streaming now, sorted by viewers
                </p>
                <LiveRow title="" streams={liveStreams} showViewAll={false} hideHeader />
              </HomeSectionShell>
            )}

            <HomeEditorialGrid
              spotlight={spotlightVideo}
              verticals={homeVerticals}
            />

            {(newReleases.length > 0 || topMovies.length > 0) && (
              <HomeSectionShell eyebrow="Cinema" title="Movies" href="/movies">
                {newReleases.length > 0 && (
                  <div className="mb-4">
                    <p className="px-4 md:px-8 text-xs font-medium text-muted-foreground mb-2">New releases</p>
                    <MovieRow title="" movies={newReleases} hideHeader showViewAll={false} />
                  </div>
                )}
                {topMovies.length > 0 && (
                  <div>
                    {newReleases.length > 0 && (
                      <p className="px-4 md:px-8 text-xs font-medium text-muted-foreground mb-2">Top picks</p>
                    )}
                    <MovieRow title="" movies={topMovies} hideHeader showViewAll={false} />
                  </div>
                )}
              </HomeSectionShell>
            )}
          </>
        )}

        {!extrasReady ? (
          <HomeDualSpotlightSkeleton />
        ) : (
          <HomeDualSpotlight shorts={homeShorts} podcasts={homePodcasts} />
        )}
      </div>

      <Footer />
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
