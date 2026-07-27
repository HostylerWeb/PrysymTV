"use client"

import { use, useState, useEffect, useRef } from "react"
import { ChevronLeft, Plus, Bookmark, Flag, Gift } from "lucide-react"
import { GiftSheet } from "@/components/gift-sheet"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { ShareSheet } from "@/components/share-sheet"
import { ReportModal } from "@/components/report-modal"
import { AuthModal } from "@/components/auth-modal"
import { PodcastPlayerBar } from "@/components/podcast-player-bar"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchPodcastEpisode,
  mapPodcastEpisodeDetail,
  recordPodcastPlay,
  togglePodcastLike,
  togglePodcastSave,
  type PodcastEpisodeCard,
} from "@/lib/api/podcasts"
import { AddToPlaylistSheet } from "@/components/add-to-playlist-sheet"
import { RelativeTime } from "@/components/relative-time"
import { userAvatarUrl } from "@/lib/user-avatar"
import { PodcastEpisodeSkeleton } from "@/components/content-skeletons"
import { useWatchAnalytics } from "@/lib/hooks/use-watch-analytics"

function toPlayerCard(
  ep: ReturnType<typeof mapPodcastEpisodeDetail>,
): PodcastEpisodeCard {
  return {
    id: ep.id,
    showId: ep.showId,
    podcast: ep.show?.title ?? ep.podcast,
    title: ep.title,
    duration: ep.duration,
    durationSeconds: ep.durationSeconds,
    date: ep.date,
    cover: ep.cover,
    plays: ep.plays,
    audioUrl: ep.audioUrl,
    videoUrl: ep.videoUrl,
    mediaType: ep.mediaType,
    description: ep.description,
    liked: ep.liked,
    saved: ep.saved,
  }
}

export default function PodcastEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const playRecorded = useRef(false)

  const [loading, setLoading] = useState(true)
  const [episode, setEpisode] = useState<ReturnType<typeof mapPodcastEpisodeDetail> | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isGiftOpen, setIsGiftOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [navTab, setNavTab] = useState("podcasts")

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

  useWatchAnalytics(episode?.id, { creatorId: episode?.creatorId })

  useEffect(() => {
    if (!episode || playRecorded.current) return
    playRecorded.current = true
    void recordPodcastPlay(episode.id).catch(() => {})
  }, [episode])

  if (loading || !episode) {
    if (loading) return <PodcastEpisodeSkeleton />
    return (
      <main className="min-h-screen bg-background flex items-center justify-center md:pl-20">
        <p className="text-muted-foreground text-sm">Episode not found</p>
      </main>
    )
  }

  const hostSlug = episode.hostSlug
  const isVideoEpisode = episode.mediaType === "video" || !!episode.videoUrl
  const playerCard = toPlayerCard({ ...episode, liked, saved })

  return (
    <main className="min-h-screen bg-background pb-36 md:pb-28 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/podcasts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Podcasts
        </Link>

        {!isVideoEpisode && (
          <img
            src={episode.cover}
            alt=""
            className="w-full max-w-sm aspect-square rounded-2xl object-cover mx-auto mb-6 shadow-xl"
          />
        )}

        {isVideoEpisode && (
          <p className="text-center text-sm text-muted-foreground mb-4">
            Video episode — use the player at the bottom of the screen.
          </p>
        )}

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

        <div className="flex justify-center gap-4 mb-8">
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
            onClick={() => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true)
                return
              }
              setIsGiftOpen(true)
            }}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            <Gift className="w-5 h-5" />
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

      <PodcastPlayerBar
        episodes={[playerCard]}
        currentIndex={0}
        onIndexChange={() => {}}
        onShare={() => setIsShareOpen(true)}
        onToggleLike={(episodeId) => {
          void togglePodcastLike(episodeId)
            .then((r) => setLiked(r.liked))
            .catch(() => {})
        }}
        isAuthenticated={isAuthenticated}
        onAuthRequired={() => setIsAuthModalOpen(true)}
        singleEpisode
      />

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
      {episode.creatorId && (
        <GiftSheet
          isOpen={isGiftOpen}
          onClose={() => setIsGiftOpen(false)}
          receiverId={episode.creatorId}
          receiverName={episode.hostName}
          onNeedAuth={() => setIsAuthModalOpen(true)}
        />
      )}
    </main>
  )
}
