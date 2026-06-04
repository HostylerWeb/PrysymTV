"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronUp } from "lucide-react"
import { VerticalEpisodeAdGate } from "@/components/vertical-episode-ad-gate"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import {
  fetchVerticalEpisode,
  type VerticalEpisodePlayback,
} from "@/lib/api/verticals"
import { saveVerticalProgress } from "@/lib/vertical-progress"
import { saveWatchProgress } from "@/lib/api/history"
import { useAuth } from "@/contexts/auth-context"

export default function VerticalWatchPage({
  params,
}: {
  params: Promise<{ slug: string; episode: string }>
}) {
  const { slug, episode: episodeStr } = use(params)
  const { isAuthenticated } = useAuth()
  const episodeNum = parseInt(episodeStr, 10)
  const [data, setData] = useState<VerticalEpisodePlayback | null>(null)
  const [showAd, setShowAd] = useState(true)
  const [canPlay, setCanPlay] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setShowAd(true)
    setCanPlay(false)
    setError(null)
    void fetchVerticalEpisode(slug, episodeNum)
      .then(setData)
      .catch(() => setError("Episode not found"))
  }, [slug, episodeNum])

  const onAdComplete = () => {
    setShowAd(false)
    setCanPlay(true)
  }

  const goNextEpisode = () => {
    if (!data?.nextEpisode) return
    const nextNum = data.nextEpisode.episodeNumber
    setShowAd(true)
    setCanPlay(false)
    void fetchVerticalEpisode(slug, nextNum)
      .then((res) => {
        setData(res)
        window.history.replaceState(null, "", `/verticals/watch/${slug}/${nextNum}`)
      })
      .catch(() => setError("Episode not found"))
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] bg-black flex items-center justify-center text-white">
        <p>{error}</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-black flex items-center justify-center text-white">
        <p className="text-white/70">Loading…</p>
      </main>
    )
  }

  const { episode, series, nextEpisode } = data

  return (
    <main className="min-h-[100dvh] bg-black flex flex-col max-w-lg mx-auto relative">
      {showAd && (
        <VerticalEpisodeAdGate
          seriesId={series.id}
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
        <span className="text-white text-sm font-medium truncate px-2">
          {series.title} · Ep {episode.episodeNumber}
        </span>
      </div>

      {canPlay && !showAd && (
        <>
          <div className="flex-1 flex items-center justify-center min-h-0">
            {episode.videoUrl ? (
              <HlsVideoPlayer
                key={episode.id}
                src={episode.videoUrl}
                className="w-full h-full max-h-[100dvh] object-contain"
                autoPlay
                controls
                videoRef={videoRef}
                onTimeUpdate={(t, d) => {
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
    </main>
  )
}
