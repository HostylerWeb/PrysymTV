"use client"

import { use, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronUp, Heart, Bookmark, Flag, Gift, Share2 } from "lucide-react"
import { GiftSheet } from "@/components/gift-sheet"
import { ShareSheet } from "@/components/share-sheet"
import { cn } from "@/lib/utils"
import { VerticalEpisodeAdGate } from "@/components/vertical-episode-ad-gate"
import { CastMediaButton } from "@/components/cast-media-button"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import {
  fetchVerticalEpisode,
  recordVerticalEpisodeView,
  toggleVerticalEpisodeLike,
  toggleVerticalEpisodeSave,
  toggleVerticalSeriesSave,
  type VerticalEpisodePlayback,
} from "@/lib/api/verticals"
import { saveVerticalProgress } from "@/lib/vertical-progress"
import { saveWatchProgress } from "@/lib/api/history"
import { bumpLikeCount } from "@/lib/engagement-count"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth-modal"
import { ReportModal } from "@/components/report-modal"
import { fetchServedAd, isValidServedAd, type ServedAd } from "@/lib/api/ads"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"
import { useWatchAnalytics } from "@/lib/hooks/use-watch-analytics"

export default function VerticalWatchPage({
  params,
}: {
  params: Promise<{ slug: string; episode: string }>
}) {
  const { slug, episode: episodeStr } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const episodeNum = parseInt(episodeStr, 10)
  const { isPlacementEnabled } = usePublicAdsConfig()
  const showAds = useShouldShowAds()
  const [data, setData] = useState<VerticalEpisodePlayback | null>(null)
  const [showAd, setShowAd] = useState(false)
  const [gateAd, setGateAd] = useState<ServedAd | null>(null)
  const [canPlay, setCanPlay] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [seriesSaved, setSeriesSaved] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isGiftOpen, setIsGiftOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const viewRecorded = useRef(false)

  const prepareEpisodeGate = useCallback(() => {
    setShowAd(false)
    setGateAd(null)
    setCanPlay(true)
    if (!showAds || !isPlacementEnabled("vertical_episode")) return
    void fetchServedAd("vertical_episode", { peek: true }).then((peekAd) => {
      if (!isValidServedAd(peekAd)) return
      setGateAd(peekAd)
      setShowAd(true)
      setCanPlay(false)
    })
  }, [showAds, isPlacementEnabled])

  useEffect(() => {
    if (authLoading) return
    setError(null)
    viewRecorded.current = false
    prepareEpisodeGate()
    void fetchVerticalEpisode(slug, episodeNum)
      .then((res) => {
        setData(res)
        setIsLiked(res.episode.liked ?? false)
        setIsSaved(res.episode.saved ?? false)
        setSeriesSaved(res.series.saved ?? false)
      })
      .catch(() => setError("Episode not found"))
  }, [slug, episodeNum, authLoading, isAuthenticated, prepareEpisodeGate])

  useWatchAnalytics(data?.episode.id, {
    creatorId: data?.series.creatorId ?? undefined,
    enabled: canPlay && Boolean(data?.episode.id),
  })

  const onAdComplete = () => {
    setShowAd(false)
    setGateAd(null)
    setCanPlay(true)
  }

  const recordViewOnce = (episodeId: string) => {
    if (viewRecorded.current) return
    viewRecorded.current = true
    void recordVerticalEpisodeView(episodeId).catch(() => {})
  }

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    action()
  }

  const goNextEpisode = () => {
    if (!data?.nextEpisode) return
    const nextNum = data.nextEpisode.episodeNumber
    prepareEpisodeGate()
    viewRecorded.current = false
    void fetchVerticalEpisode(slug, nextNum)
      .then((res) => {
        setData(res)
        setIsLiked(res.episode.liked ?? false)
        setIsSaved(res.episode.saved ?? false)
        setSeriesSaved(res.series.saved ?? false)
        window.history.replaceState(null, "", `/verticals/watch/${slug}/${nextNum}`)
      })
      .catch(() => setError("Episode not found"))
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center text-muted-foreground md:pl-20">
        <p>{error}</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center text-muted-foreground md:pl-20">
        <p>Loading…</p>
      </main>
    )
  }

  const { episode, series, nextEpisode } = data

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col max-w-lg mx-auto relative md:border-x border-border">
      {showAd && gateAd && (
        <VerticalEpisodeAdGate
          servedAd={gateAd}
          creatorId={series.creatorId ?? undefined}
          onComplete={onAdComplete}
        />
      )}

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3">
        <Link href={`/verticals/${slug}`}>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white text-sm font-medium truncate px-2">
            {series.title} · Ep {episode.episodeNumber}
          </span>
          {canPlay && !showAd && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  requireAuth(() => {
                    const wasLiked = isLiked
                    void toggleVerticalEpisodeLike(episode.id)
                      .then((r) => {
                        setIsLiked(r.liked)
                        setData((prev) =>
                          prev
                            ? {
                                ...prev,
                                episode: {
                                  ...prev.episode,
                                  liked: r.liked,
                                  likesCount: bumpLikeCount(
                                    prev.episode.likesCount ?? 0,
                                    wasLiked,
                                    r.liked,
                                  ),
                                },
                              }
                            : prev,
                        )
                      })
                      .catch(() => {})
                  })
                }
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  isLiked ? "bg-primary" : "bg-black/50",
                )}
              >
                <Heart className={cn("w-4 h-4 text-white", isLiked && "fill-white")} />
              </button>
              <button
                type="button"
                onClick={() =>
                  requireAuth(() =>
                    void toggleVerticalEpisodeSave(episode.id)
                      .then((r) => setIsSaved(r.saved))
                      .catch(() => {}),
                  )
                }
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  isSaved ? "bg-primary" : "bg-black/50",
                )}
              >
                <Bookmark className={cn("w-4 h-4 text-white", isSaved && "fill-white")} />
              </button>
              <button
                type="button"
                onClick={() =>
                  requireAuth(() =>
                    void toggleVerticalSeriesSave(series.id)
                      .then((r) => setSeriesSaved(r.saved))
                      .catch(() => {}),
                  )
                }
                className={cn(
                  "px-2 h-9 rounded-full text-[10px] font-medium text-white",
                  seriesSaved ? "bg-primary" : "bg-black/50",
                )}
              >
                {seriesSaved ? "Series saved" : "Save series"}
              </button>
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                onClick={() => requireAuth(() => setIsGiftOpen(true))}
                className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
                aria-label="Send gift"
              >
                <Gift className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
                aria-label="Report"
              >
                <Flag className="w-4 h-4 text-white" />
              </button>
              <CastMediaButton
                variant="on-video"
                className="w-9 h-9 !bg-black/50"
                media={
                  episode.videoUrl
                    ? {
                        title: episode.title,
                        subtitle: `${series.title} · Ep ${episode.episodeNumber}`,
                        streamUrl: episode.videoUrl,
                        posterUrl: series.posterUrl ?? undefined,
                      }
                    : null
                }
                getCurrentTime={() => videoRef.current?.currentTime ?? 0}
                onCastStarted={() => {
                  const el = videoRef.current
                  if (el && !el.paused) el.pause()
                }}
              />
            </div>
          )}
        </div>
      </div>

      {canPlay && !showAd && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-black">
            {episode.videoUrl ? (
              <HlsVideoPlayer
                key={episode.id}
                src={episode.videoUrl}
                className="w-full h-full max-h-[100dvh] object-contain"
                autoPlay
                controls
                showQualitySelector
                videoRef={videoRef}
                onPlay={() => recordViewOnce(episode.id)}
                onTimeUpdate={(t, d) => {
                  recordViewOnce(episode.id)
                  const progressSeconds = Math.floor(t)
                  const durationSeconds = Math.floor(d) || episode.durationSeconds
                  if (!isAuthenticated) {
                    saveVerticalProgress({
                      slug,
                      seriesTitle: series.title,
                      posterUrl: series.posterUrl ?? null,
                      episodeNumber: episode.episodeNumber,
                      episodeTitle: episode.title,
                      progressSeconds,
                      durationSeconds,
                    })
                    return
                  }
                  void saveWatchProgress({
                    contentType: "vertical_episode",
                    contentId: episode.id,
                    progressSeconds,
                    completed:
                      durationSeconds > 0 && progressSeconds >= durationSeconds * 0.95,
                  }).catch(() => {
                    /* keep playback smooth if API fails */
                  })
                }}
                onEnded={() => {
                  if (nextEpisode) goNextEpisode()
                }}
              />
            ) : (
              <p className="text-white/60">Video unavailable</p>
            )}
          </div>

          {episode.cliffhanger && (
            <p className="text-center text-white/80 text-sm px-4 py-2">{episode.cliffhanger}</p>
          )}

          {nextEpisode ? (
            <button
              type="button"
              onClick={goNextEpisode}
              className="mx-4 mb-8 py-4 rounded-full bg-primary text-white font-semibold flex items-center justify-center gap-2"
            >
              Next: Episode {nextEpisode.episodeNumber}
              <ChevronUp className="w-5 h-5 rotate-90" />
            </button>
          ) : (
            <p className="text-center text-white/60 text-sm pb-8">End of season</p>
          )}
        </>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {data && (
        <ShareSheet
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          title={`${data.series.title} · Ep ${data.episode.episodeNumber}`}
          targetId={data.episode.id}
        />
      )}
      {data && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="vertical_episode"
          targetId={data.episode.id}
          targetLabel={`${data.series.title} · ${data.episode.title}`}
        />
      )}
      {data?.series.creatorId && (
        <GiftSheet
          isOpen={isGiftOpen}
          onClose={() => setIsGiftOpen(false)}
          receiverId={data.series.creatorId}
          receiverName={data.series.title}
          onNeedAuth={() => setIsAuthModalOpen(true)}
        />
      )}
    </main>
  )
}
