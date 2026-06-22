"use client"

import { use, useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, Play, Plus, Check, Share2, Clock, Calendar, Lock, Flag, ThumbsUp, Maximize, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { AdPreroll } from "@/components/ad-preroll"
import { ReportModal } from "@/components/report-modal"
import { ShareSheet } from "@/components/share-sheet"
import { Footer } from "@/components/footer"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import { useAuth } from "@/contexts/auth-context"
import { genreLabel, fetchMovieGenres } from "@/lib/api/categories"
import { fetchVideo, recordVideoView, toggleVideoLike, toggleVideoSave } from "@/lib/api/videos-feed"
import { useWatchAnalytics } from "@/lib/hooks/use-watch-analytics"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"
import { saveWatchProgress } from "@/lib/api/history"
import { fetchServedAd, type ServedAd } from "@/lib/api/ads"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"
import { bumpLikeCount } from "@/lib/engagement-count"
import type { ApiVideoDetail } from "@/lib/api/videos-feed"
import { useIsMobile } from "@/hooks/use-mobile"
import { useImmersivePlayer } from "@/lib/hooks/use-immersive-player"

type MovieDisplay = {
  id: string
  creatorId: string
  title: string
  poster: string
  banner: string
  year: string
  rating: string
  genre: string
  genres: string[]
  duration: string
  ageRating: string
  tagline: string
  description: string
  longDescription: string
  director: string
  writers: string[]
  matchScore: string
  views: string
  videoUrl: string
  category: string
  cast: Array<{ name: string; role: string }>
}

function mapApiToMovie(
  v: ApiVideoDetail,
  genres: Array<{ slug: string; label: string }>,
): MovieDisplay {
  const genreSlug = v.category ?? "drama"
  const label = genreLabel(genreSlug, genres)
  return {
    id: v.id,
    creatorId: v.creator.id,
    title: v.title,
    poster: videoThumbnail(v.thumbnailUrl),
    banner: videoThumbnail(v.thumbnailUrl),
    year: String(v.releaseYear ?? new Date().getFullYear()),
    rating: v.likesCount > 0 ? formatViewCount(v.likesCount) : "—",
    genre: label,
    genres: [label],
    duration: formatDuration(v.durationSeconds),
    ageRating: v.ageRating ?? "PG-13",
    tagline: v.tagline ?? "",
    description: v.description ?? "",
    longDescription: v.description ?? "",
    director: v.director ?? v.creator.displayName ?? v.creator.username,
    writers: v.writers ?? [],
    matchScore:
      v.viewsCount > 0
        ? `${Math.min(99, Math.round((v.likesCount / v.viewsCount) * 100))}%`
        : "—",
    views: formatViewCount(v.viewsCount),
    videoUrl: v.playbackUrl ?? v.videoUrl ?? v.hlsMasterUrl ?? "",
    category: genreSlug,
    cast: (v.cast ?? []).map((m) => ({
      name: m.name,
      role: m.role,
    })),
  }
}

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [movie, setMovie] = useState<MovieDisplay | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isInList, setIsInList] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [activeTab, setActiveTab] = useState("movies")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPreroll, setShowPreroll] = useState(false)
  const [prerollAd, setPrerollAd] = useState<ServedAd | null>(null)
  const [prerollLoading, setPrerollLoading] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isMobile = useIsMobile()
  const {
    playerContainerRef,
    isImmersive,
    toggleImmersive,
    exitImmersive,
    immersiveClassName,
  } = useImmersivePlayer()
  const progressSent = useRef(0)
  const viewRecorded = useRef(false)
  const { isPlacementEnabled } = usePublicAdsConfig()
  const showAds = useShouldShowAds()
  useWatchAnalytics(isPlaying ? movie?.id : undefined, { creatorId: movie?.creatorId })

  useEffect(() => {
    viewRecorded.current = false
  }, [id])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [api, genresRes] = await Promise.all([fetchVideo(id), fetchMovieGenres()])
        if (cancelled) return
        setMovie(mapApiToMovie(api, genresRes.items))
        setLikesCount(api.likesCount ?? 0)
        setIsInList(api.saved ?? false)
        setIsLiked(api.liked ?? false)
      } catch {
        if (!cancelled) setMovie(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, authLoading, isAuthenticated])

  const persistProgress = useCallback(
    (seconds: number, dur: number, completed = false) => {
      if (!isAuthenticated || !movie) return
      const bucket = Math.floor(seconds / 10)
      if (!completed && bucket === progressSent.current) return
      progressSent.current = bucket
      void saveWatchProgress({
        contentType: "video",
        contentId: movie.id,
        progressSeconds: Math.floor(seconds),
        completed,
      }).catch(() => {})
    },
    [isAuthenticated, movie],
  )

  const startPlayback = useCallback(() => {
    setShowPreroll(false)
    setPrerollAd(null)
    setPrerollLoading(false)
    setIsPlaying(true)
    if (!viewRecorded.current) {
      viewRecorded.current = true
      void recordVideoView(id).catch(() => {})
    }
  }, [id])

  const handleWatchNow = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    if (!showAds || !isPlacementEnabled("movie_preroll")) {
      startPlayback()
      return
    }
    setPrerollLoading(true)
    void fetchServedAd("movie_preroll", { peek: true })
      .then((peekAd) => {
        if (!peekAd?.mediaUrl?.trim()) {
          startPlayback()
          return
        }
        return fetchServedAd("movie_preroll").then((ad) => {
          if (ad?.mediaUrl?.trim()) {
            setPrerollAd(ad)
            setShowPreroll(true)
          } else {
            startPlayback()
          }
        })
      })
      .catch(() => startPlayback())
      .finally(() => setPrerollLoading(false))
  }

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) setIsAuthModalOpen(true)
    else action()
  }

  if (loading || !movie) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background md:pl-20">
        <p className="text-muted-foreground">{loading ? "Loading…" : "Movie not found"}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-7xl mx-auto w-full">
        <div
          ref={playerContainerRef}
          className={cn(
            "relative w-full aspect-video md:aspect-[21/9] bg-black overflow-hidden",
            isImmersive && immersiveClassName,
          )}
        >
          {prerollLoading && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center">
              <p className="text-white/70 text-sm">Loading…</p>
            </div>
          )}
          {showPreroll && prerollAd && (
            <AdPreroll
              servedAd={prerollAd}
              onComplete={startPlayback}
              creatorId={movie.creatorId}
              videoId={movie.id}
            />
          )}
          {isPlaying ? (
            <>
              <HlsVideoPlayer
                src={movie.videoUrl}
                poster={movie.banner}
                className="w-full h-full object-contain"
                autoPlay
                controls
                disableNativeFullscreen={isMobile}
                onNativeFullscreenBlocked={toggleImmersive}
                playsInline
                videoRef={videoRef}
                onTimeUpdate={(t, d) => persistProgress(t, d)}
                onEnded={() => persistProgress(0, 0, true)}
              />
              <button
                type="button"
                onClick={() => {
                  if (isImmersive) exitImmersive()
                  setIsPlaying(false)
                }}
                className="absolute top-4 left-4 z-[110] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white"
                aria-label="Close player"
              >
                ✕
              </button>
              {isMobile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleImmersive()
                  }}
                  className="absolute bottom-4 right-4 z-[110] w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white"
                  aria-label={isImmersive ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isImmersive ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              <img src={movie.banner} alt={movie.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                <Link href="/movies"><button className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center"><ChevronLeft className="w-6 h-6 text-white" /></button></Link>
                <div className="flex gap-2">
                  <button onClick={() => setIsShareOpen(true)} className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></button>
                  <button onClick={() => setIsReportOpen(true)} className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center"><Flag className="w-5 h-5 text-white" /></button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8 hidden md:block">
                <span className="text-primary text-sm font-bold">{movie.matchScore} Match</span>
                <h1 className="text-4xl font-bold text-white mb-2">{movie.title}</h1>
                <p className="text-white/80 italic mb-4">{movie.tagline}</p>
                <Button size="lg" onClick={handleWatchNow} className="rounded-full gap-2">
                  {isAuthenticated ? <><Play className="w-6 h-6 fill-current" /> Watch Now</> : <><Lock className="w-6 h-6" /> Sign in to Watch</>}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="px-4 md:px-8 py-6">
          <div>
            <div className="md:hidden mb-4">
              <h1 className="text-2xl font-bold">{movie.title}</h1>
              <p className="text-sm text-muted-foreground italic">{movie.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-sm"><Calendar className="w-4 h-4" />{movie.year}</span>
              <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-sm"><Clock className="w-4 h-4" />{movie.duration}</span>
              <span className="px-2 py-1 rounded-full bg-secondary text-sm">{movie.ageRating}</span>
            </div>
            <div className="flex gap-3 mb-6 md:hidden">
              <Button onClick={handleWatchNow} className="flex-1 rounded-full gap-2">{isAuthenticated ? "Watch Now" : "Sign in"}</Button>
              <button
                type="button"
                onClick={() =>
                  requireAuth(() => {
                    const wasLiked = isLiked
                    void toggleVideoLike(id)
                      .then((r) => {
                        setIsLiked(r.liked)
                        setLikesCount((c) => bumpLikeCount(c, wasLiked, r.liked))
                      })
                      .catch(() => {
                        setIsLiked((p) => !p)
                        setLikesCount((c) => bumpLikeCount(c, wasLiked, !wasLiked))
                      })
                  })
                }
                className={cn("w-12 h-12 rounded-full flex items-center justify-center", isLiked ? "bg-primary text-white" : "bg-secondary")}
              >
                <ThumbsUp className={cn("w-6 h-6", isLiked && "fill-current")} />
              </button>
              <button type="button" onClick={() => requireAuth(() => void toggleVideoSave(id).then((r) => setIsInList(r.saved)).catch(() => setIsInList(!isInList)))} className={cn("w-12 h-12 rounded-full flex items-center justify-center", isInList ? "bg-primary text-white" : "bg-secondary")}>
                {isInList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">{movie.genres.map((g) => <span key={g} className="px-3 py-1 rounded-full bg-secondary/50 text-sm">{g}</span>)}</div>
            <p className={cn("text-sm text-foreground/80", !showFullDescription && "line-clamp-3 md:line-clamp-none")}>{showFullDescription ? movie.longDescription : movie.description}</p>
            <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-sm text-primary mt-2 md:hidden">{showFullDescription ? "Show Less" : "Read More"}</button>
            {movie.director && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-1">Director</h3>
                <p className="text-sm text-foreground/80">{movie.director}</p>
              </div>
            )}
            {movie.cast.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Top Cast</h3>
                <ul className="flex flex-wrap gap-x-6 gap-y-3">
                  {movie.cast.map((m) => (
                    <li key={m.name}>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="video"
        targetId={movie.id}
        targetLabel={movie.title}
      />
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={movie.title}
        targetId={movie.id}
      />
    </main>
  )
}
