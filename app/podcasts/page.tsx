"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart,
  Share2, MoreHorizontal, Mic, Clock, Users, TrendingUp,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ShareSheet } from "@/components/share-sheet"
import {
  fetchPodcastEpisodesFeed,
  fetchPodcastFeatured,
  fetchPodcastTrendingShows,
  recordPodcastPlay,
  togglePodcastLike,
  type PodcastEpisodeCard,
  type PodcastShowCard,
} from "@/lib/api/podcasts"
import { fetchDiscoverPlaylists, type PlaylistSummary } from "@/lib/api/playlists"
import { videoThumbnail } from "@/lib/format-media"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { userAvatarUrl } from "@/lib/user-avatar"
import { CreateFlowModals, triggerContextualCreate } from "@/components/create-flow-modals"
import { PodcastPageSkeleton } from "@/components/content-skeletons"
import { useCreateFlow } from "@/hooks/use-create-flow"
import { useRouter } from "next/navigation"
import { fetchPodcastCategories } from "@/lib/api/categories"
import { HlsVideoPlayer } from "@/components/hls-video-player"

function isVideoEpisode(ep?: PodcastEpisodeCard | null) {
  return ep?.mediaType === "video" || !!ep?.videoUrl
}

const FALLBACK_PODCAST_FILTER_CATEGORIES = [
  "All",
  "True Crime",
  "Tech",
  "Business",
  "Comedy",
  "Health",
  "Society",
  "Science",
  "Sports",
  "Music",
]

type FeaturedPodcast = {
  id: string
  title: string
  host: string
  cover: string
  banner: string
  category: string
  episodes: number
  followers: string
  latestEpisode: string
  latestDuration: string
  description: string
}

function showToFeatured(show: PodcastShowCard, latest?: PodcastEpisodeCard): FeaturedPodcast {
  return {
    id: show.id,
    title: show.title,
    host: show.host,
    cover: videoThumbnail(show.cover || null),
    banner: videoThumbnail(show.banner ?? show.cover ?? null),
    category: show.category,
    episodes: show.episodes,
    followers: show.followers,
    latestEpisode: latest?.title ?? show.latestEpisodeTitle ?? "Latest episode",
    latestDuration: latest?.duration ?? "",
    description:
      show.description ??
      "Listen to the latest episodes from creators on Prysym TV.",
  }
}

// ─── MINI AUDIO PLAYER BAR ─────────────────────────────────────────────────

function PlayerBar({
  episodes,
  currentIndex,
  onIndexChange,
  onShare,
  onToggleLike,
  isAuthenticated,
  onAuthRequired,
}: {
  episodes: PodcastEpisodeCard[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onShare: () => void
  onToggleLike: (episodeId: string) => void
  isAuthenticated: boolean
  onAuthRequired: () => void
}) {
  const episode = episodes[currentIndex]
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(12)
  const [muted, setMuted] = useState(false)
  const liked = episode?.liked ?? false
  const isVideo = isVideoEpisode(episode)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !episode?.audioUrl || isVideo) return
    audio.src = episode.audioUrl
    audio.muted = muted
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [episode?.id, episode?.audioUrl, isPlaying, muted, isVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !episode?.videoUrl || !isVideo) return
    video.muted = muted
    if (isPlaying) void video.play().catch(() => setIsPlaying(false))
    else video.pause()
  }, [episode?.id, episode?.videoUrl, isPlaying, muted, isVideo])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || episode?.audioUrl || isVideo) return
    if (!isPlaying || !episode) return
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (currentIndex < episodes.length - 1) {
            onIndexChange(currentIndex + 1)
            return 0
          }
          setIsPlaying(false)
          return 100
        }
        const step =
          episode.durationSeconds > 0 ? 100 / episode.durationSeconds : 0.35
        return p + step
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isPlaying, episode, currentIndex, episodes.length, onIndexChange, episode?.audioUrl, isVideo])

  useEffect(() => {
    setProgress(8)
    setIsPlaying(true)
  }, [currentIndex])

  if (!episode) return null

  const goPrev = () => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1)
  }
  const goNext = () => {
    if (currentIndex < episodes.length - 1) onIndexChange(currentIndex + 1)
  }

  return (
    <>
      {isVideo && episode.videoUrl ? (
        <div className="fixed left-0 right-0 md:left-20 z-[45] bottom-[calc(7.5rem+env(safe-area-inset-bottom))] md:bottom-[4.75rem] px-3 md:px-6 pointer-events-none">
          <div className="max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-border pointer-events-auto">
            <HlsVideoPlayer
              key={episode.id}
              src={episode.videoUrl}
              poster={episode.cover}
              className="w-full h-full object-contain"
              controls
              playsInline
              videoRef={videoRef}
              muted={muted}
              onTimeUpdate={(t, d) => {
                if (d > 0) setProgress((t / d) * 100)
              }}
              onEnded={() => {
                if (currentIndex < episodes.length - 1) onIndexChange(currentIndex + 1)
                else setIsPlaying(false)
              }}
            />
          </div>
        </div>
      ) : null}
    <div className="fixed bottom-16 md:bottom-0 md:left-20 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
      {episode?.audioUrl ? (
        <audio
          ref={audioRef}
          className="hidden"
          onTimeUpdate={() => {
            const audio = audioRef.current
            if (!audio?.duration) return
            setProgress((audio.currentTime / audio.duration) * 100)
          }}
          onEnded={() => {
            if (currentIndex < episodes.length - 1) onIndexChange(currentIndex + 1)
            else setIsPlaying(false)
          }}
        />
      ) : null}
      <div
        className="w-full h-1 bg-border cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setProgress(((e.clientX - rect.left) / rect.width) * 100)
        }}
      >
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/podcast/${episode.id}`}>
          <img src={episode.cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 hover:opacity-90" />
        </Link>
        <Link href={`/podcast/${episode.id}`} className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate hover:text-primary">
            {episode.title}
            {isVideo ? (
              <span className="ml-1.5 text-[10px] font-medium text-primary/80">Video</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground truncate">{episode.podcast}</p>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                onAuthRequired()
                return
              }
              if (episode) onToggleLike(episode.id)
            }}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              liked ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-primary")} />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={currentIndex >= episodes.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────────────

const EMPTY_FEATURED: FeaturedPodcast = {
  id: "",
  title: "Podcasts on Prysym TV",
  host: "Creators",
  cover: videoThumbnail(null),
  banner: videoThumbnail(null),
  category: "All",
  episodes: 0,
  followers: "0",
  latestEpisode: "Upload your first show",
  latestDuration: "",
  description: "Discover shows and episodes from creators on the platform.",
}

export default function PodcastsPage() {
  const router = useRouter()
  const createFlow = useCreateFlow()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const uploadPodcast = () =>
    triggerContextualCreate("podcast", createFlow, { isAuthenticated, user })
  const [activeTab, setActiveTab] = useState("podcasts")
  const [activeCategory, setActiveCategory] = useState("All")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [playIndex, setPlayIndex] = useState<number | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shows, setShows] = useState<PodcastShowCard[]>([])
  const [trendingShows, setTrendingShows] = useState<PodcastShowCard[]>([])
  const [latestEpisodes, setLatestEpisodes] = useState<PodcastEpisodeCard[]>([])
  const [featuredPodcast, setFeaturedPodcast] = useState<FeaturedPodcast>(EMPTY_FEATURED)
  const [curatedPlaylists, setCuratedPlaylists] = useState<PlaylistSummary[]>([])
  const [categories, setCategories] = useState<string[]>(FALLBACK_PODCAST_FILTER_CATEGORIES)

  useEffect(() => {
    void fetchPodcastCategories()
      .then((res) => {
        if (res.items.length > 0) {
          setCategories(["All", ...res.items.map((c) => c.label)])
        }
      })
      .catch(() => setCategories(FALLBACK_PODCAST_FILTER_CATEGORIES))
  }, [])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setLoading(true)
    void Promise.all([
      fetchPodcastTrendingShows(24),
      fetchPodcastEpisodesFeed(1, 30),
      fetchPodcastFeatured(1),
      fetchDiscoverPlaylists(6).catch(() => ({ items: [] as PlaylistSummary[] })),
    ])
      .then(([trendingRes, epsRes, featuredList, playlistsRes]) => {
        if (cancelled) return
        setCuratedPlaylists(playlistsRes.items)
        setTrendingShows(trendingRes)
        setShows(trendingRes)
        setLatestEpisodes(epsRes.items)
        const featShow =
          featuredList[0] ?? trendingRes[0] ?? null
        if (featShow) {
          const latest =
            epsRes.items.find((e) => e.showId === featShow.id) ?? epsRes.items[0]
          setFeaturedPodcast(showToFeatured(featShow, latest))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  const topCreators = useMemo(
    () =>
      shows.slice(0, 5).map((s, i) => ({
        id: s.id,
        slug: s.hostSlug,
        name: s.host,
        handle: `@${s.hostSlug}`,
        avatar: userAvatarUrl(null, s.hostSlug),
        shows: 1,
        followers: s.followers,
        isVerified: i < 2,
      })),
    [shows],
  )

  const startEpisode = (ep: PodcastEpisodeCard) => {
    void recordPodcastPlay(ep.id).catch(() => {})
    const idx = latestEpisodes.findIndex((e) => e.id === ep.id)
    setPlayIndex(idx >= 0 ? idx : 0)
  }

  const episodeForShow = (showTitle: string) =>
    latestEpisodes.find((e) => e.podcast === showTitle) ?? latestEpisodes[0]

  const nowPlaying = playIndex !== null ? latestEpisodes[playIndex] : null

  const filteredShows =
    activeCategory === "All"
      ? trendingShows
      : trendingShows.filter((s) => s.category === activeCategory)

  const toggleLike = (id: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    void togglePodcastLike(id)
      .then((r) => {
        setLatestEpisodes((prev) =>
          prev.map((ep) => (ep.id === id ? { ...ep, liked: r.liked } : ep)),
        )
      })
      .catch(() => {})
  }

  const isEpisodeLiked = (ep: PodcastEpisodeCard) => ep.liked ?? false

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-32 md:pb-20 md:pl-20">
        <Header
          onSearchClick={() => setIsSearchOpen(true)}
          onCreateClick={uploadPodcast}
          createLabel="Upload podcast episode"
        />
        <PodcastPageSkeleton />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-32 md:pb-20 md:pl-20">
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        onCreateClick={uploadPodcast}
        createLabel="Upload podcast episode"
      />

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div className="relative w-full h-72 md:h-[420px] overflow-hidden">
        <img
          src={featuredPodcast.banner}
          alt={featuredPodcast.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-end md:items-center">
          <div className="px-4 md:px-10 pb-6 md:pb-0 flex gap-5 items-end md:items-center max-w-3xl">
            <img
              src={featuredPodcast.cover}
              alt={featuredPodcast.title}
              className="w-20 h-20 md:w-32 md:h-32 rounded-2xl object-cover shadow-2xl flex-shrink-0 border-2 border-primary/40"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-white uppercase tracking-wider">Featured</span>
                <span className="text-xs text-muted-foreground">{featuredPodcast.category}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight mb-1">{featuredPodcast.title}</h1>
              <p className="text-sm text-muted-foreground mb-2 hidden md:block">{featuredPodcast.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> {featuredPodcast.host}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {featuredPodcast.followers}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featuredPodcast.episodes} episodes</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEpisode(episodeForShow(featuredPodcast.title))}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" /> Play Latest
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold rounded-full hover:bg-secondary/80 transition-all">
                  <Plus className="w-4 h-4" /> Follow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">

        {/* ── CATEGORY FILTER ─────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
                activeCategory === cat
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── TRENDING SHOWS GRID ──────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trending Shows
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredShows.map((show) => (
              <div key={show.id} className="group">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-lg">
                  <img
                    src={show.cover}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => startEpisode(episodeForShow(show.title))}
                      className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 md:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl"
                      aria-label={`Play ${show.title}`}
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 text-xs bg-black/70 backdrop-blur-md text-white px-2 py-0.5 rounded-full font-medium">
                    {show.category}
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{show.title}</p>
                <p className="text-xs text-muted-foreground">{show.host}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{show.followers} followers</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN 2-COLUMN LAYOUT ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Latest Episodes (left/wide) */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-4">Latest Episodes</h2>
            <div className="space-y-2">
              {latestEpisodes.map((ep, i) => (
                <div
                  key={ep.id}
                  onClick={() => startEpisode(ep)}
                  onDoubleClick={() => { window.location.href = `/podcast/${ep.id}` }}
                  className={cn(
                    "group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-200",
                    nowPlaying?.id === ep.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/30 hover:bg-secondary/60"
                  )}
                >
                  {/* Index / Playing indicator */}
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {nowPlaying?.id === ep.id ? (
                      <span className="flex gap-0.5 items-end h-4">
                        <span className="w-0.5 bg-primary rounded-full animate-bounce h-3" style={{ animationDelay: "0ms" }} />
                        <span className="w-0.5 bg-primary rounded-full animate-bounce h-4" style={{ animationDelay: "150ms" }} />
                        <span className="w-0.5 bg-primary rounded-full animate-bounce h-2" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground group-hover:hidden">{i + 1}</span>
                    )}
                    {nowPlaying?.id !== ep.id && (
                      <Play className="w-4 h-4 text-primary hidden group-hover:block fill-primary" />
                    )}
                  </div>

                  {/* Cover */}
                  <img src={ep.cover} alt={ep.podcast} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {ep.title}
                      {isVideoEpisode(ep) ? (
                        <span className="ml-2 text-[10px] font-medium text-primary">Video</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">{ep.podcast} · {ep.date}</p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{ep.plays} plays</span>
                    <button
                      onClick={e => { e.stopPropagation(); toggleLike(ep.id) }}
                      className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", isEpisodeLiked(ep) ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                      <Heart className={cn("w-4 h-4", isEpisodeLiked(ep) && "fill-primary")} />
                    </button>
                    <span className="text-xs text-muted-foreground w-10 text-right">{ep.duration}</span>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">

            {/* Top Creators */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Top Creators</h2>
              <div className="space-y-3">
                {topCreators.map((creator, i) => (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.slug}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors group"
                  >
                    <span className="text-sm font-black text-muted-foreground w-5 text-center">{i + 1}</span>
                    <div className="relative">
                      <img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full object-cover" />
                      {creator.isVerified && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="currentColor"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">{creator.followers} followers</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {curatedPlaylists.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Curated Playlists</h2>
              <div className="space-y-3">
                {curatedPlaylists.map((pl) => (
                  <Link
                    key={pl.id}
                    href={`/playlist/${pl.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors group"
                  >
                    <img
                      src={videoThumbnail(pl.coverUrl)}
                      alt={pl.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary">
                        {pl.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{pl.itemCount} items</p>
                    </div>
                    <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
            )}

          </div>
        </div>
      </div>

      <Footer />

      {/* ── AUDIO PLAYER BAR ───────────────────────────────────────────────── */}
      {playIndex !== null && (
        <PlayerBar
          episodes={latestEpisodes}
          currentIndex={playIndex}
          onIndexChange={setPlayIndex}
          onShare={() => setIsShareOpen(true)}
          onToggleLike={toggleLike}
          isAuthenticated={isAuthenticated}
          onAuthRequired={() => setIsAuthModalOpen(true)}
        />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={nowPlaying?.title ?? "Podcast"}
        url={nowPlaying ? `${typeof window !== "undefined" ? window.location.origin : ""}/podcast/${nowPlaying.id}` : undefined}
      />

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <CreateFlowModals
        flow={createFlow}
        onOpenSettings={() => router.push("/profile?settings=go-live")}
        onNeedCreatorVerification={() => router.push("/profile")}
      />
    </main>
  )
}
