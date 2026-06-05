"use client"

import { use, useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, Play, Pause, Heart, Share2, Plus, Bookmark, Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { ShareSheet } from "@/components/share-sheet"
import { ReportModal } from "@/components/report-modal"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchPodcastEpisode,
  mapPodcastEpisodeDetail,
  recordPodcastPlay,
  togglePodcastLike,
  togglePodcastSave,
} from "@/lib/api/podcasts"
import { AddToPlaylistSheet } from "@/components/add-to-playlist-sheet"
import { saveWatchProgress } from "@/lib/api/history"
import { RelativeTime } from "@/components/relative-time"
import { userAvatarUrl } from "@/lib/user-avatar"

export default function PodcastEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressSent = useRef(0)

  const [loading, setLoading] = useState(true)
  const [episode, setEpisode] = useState<ReturnType<typeof mapPodcastEpisodeDetail> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [navTab, setNavTab] = useState("podcasts")
  const playRecorded = useRef(false)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setLoading(true)
    void fetchPodcastEpisode(id)
      .then((raw) => {
        if (cancelled) return
        const mapped = mapPodcastEpisodeDetail(raw)
        setEpisode(mapped)
        setLiked(mapped.liked)
        setSaved(mapped.saved)
      })
      .catch(() => {
        if (!cancelled) setEpisode(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, authLoading, isAuthenticated])

  useEffect(() => {
    if (!episode || playRecorded.current) return
    playRecorded.current = true
    void recordPodcastPlay(episode.id).catch(() => {})
  }, [episode])

  const persistProgress = useCallback(
    (seconds: number, completed = false) => {
      if (!isAuthenticated || !episode) return
      const bucket = Math.floor(seconds / 15)
      if (!completed && bucket === progressSent.current) return
      progressSent.current = bucket
      void saveWatchProgress({
        contentType: "podcast_episode",
        contentId: episode.id,
        progressSeconds: Math.floor(seconds),
        completed,
      }).catch(() => {})
    },
    [isAuthenticated, episode],
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !episode?.audioUrl) return
    audio.src = episode.audioUrl
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [episode?.audioUrl, isPlaying, episode?.id])

  if (loading || !episode) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center md:pl-20">
        <p className="text-muted-foreground text-sm">Loading episode…</p>
      </main>
    )
  }

  const hostSlug = episode.hostSlug

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/podcasts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Podcasts
        </Link>
        <img
          src={episode.cover}
          alt=""
          className="w-full max-w-sm aspect-square rounded-2xl object-cover mx-auto mb-6 shadow-xl"
        />
        <p className="text-sm text-primary font-medium text-center mb-1">
          {episode.show?.title ?? episode.podcast}
        </p>
        <h1 className="text-2xl font-bold text-center mb-2">{episode.title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {episode.plays} plays · {episode.duration} ·{" "}
          <RelativeTime date={episode.publishedAt} className="inline" />
        </p>
        {episode.description && (
          <p className="text-sm text-foreground/80 mb-8">{episode.description}</p>
        )}
        {episode.audioUrl ? (
          <audio
            ref={audioRef}
            className="hidden"
            onTimeUpdate={() => {
              const audio = audioRef.current
              if (!audio) return
              persistProgress(audio.currentTime)
            }}
            onEnded={() => {
              persistProgress(episode.durationSeconds, true)
              setIsPlaying(false)
            }}
          />
        ) : null}
        <div className="flex justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true)
                return
              }
              void togglePodcastLike(episode.id)
                .then((r) => setLiked(r.liked))
                .catch(() => {})
            }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              liked ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            <Heart className={cn("w-5 h-5", liked && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true)
                return
              }
              void togglePodcastSave(episode.id)
                .then((r) => setSaved(r.saved))
                .catch(() => {})
            }}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              saved ? "bg-primary text-primary-foreground" : "bg-secondary",
            )}
          >
            <Bookmark className={cn("w-5 h-5", saved && "fill-current")} />
          </button>
          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true)
                return
              }
              setIsPlaylistOpen(true)
            }}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
            aria-label="Report episode"
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>
        {hostSlug ? (
          <Link
            href={`/creator/${hostSlug}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors"
          >
            <img
              src={userAvatarUrl(null, hostSlug)}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-sm font-medium">Hosted by {episode.hostName}</span>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground text-center">Hosted by {episode.hostName}</p>
        )}
      </div>
      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={episode.title}
        targetId={episode.id}
        url={
          typeof window !== "undefined"
            ? `${window.location.origin}/podcast/${episode.id}`
            : undefined
        }
      />
      <AddToPlaylistSheet
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        itemType="podcast_episode"
        itemId={episode.id}
        itemTitle={episode.title}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="podcast_episode"
        targetId={episode.id}
        targetLabel={episode.title}
      />
    </main>
  )
}
