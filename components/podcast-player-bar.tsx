"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Heart,
  Pause,
  Play,
  Share2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { CastMediaButton } from "@/components/cast-media-button"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import type { PodcastEpisodeCard } from "@/lib/api/podcasts"
import { cn } from "@/lib/utils"

function isVideoEpisode(ep?: PodcastEpisodeCard | null) {
  return ep?.mediaType === "video" || !!ep?.videoUrl
}

export type PodcastPlayerBarProps = {
  episodes: PodcastEpisodeCard[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onShare: () => void
  onToggleLike: (episodeId: string) => void
  isAuthenticated: boolean
  onAuthRequired: () => void
  /** Hide prev/next when only one episode (episode detail page). */
  singleEpisode?: boolean
  /** Episode page: inline video above content instead of floating. */
  inlineVideo?: boolean
}

export function PodcastPlayerBar({
  episodes,
  currentIndex,
  onIndexChange,
  onShare,
  onToggleLike,
  isAuthenticated,
  onAuthRequired,
  singleEpisode = false,
  inlineVideo = false,
}: PodcastPlayerBarProps) {
  const episode = episodes[currentIndex]
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(8)
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
          if (!singleEpisode && currentIndex < episodes.length - 1) {
            onIndexChange(currentIndex + 1)
            return 0
          }
          setIsPlaying(false)
          return 100
        }
        const step = episode.durationSeconds > 0 ? 100 / episode.durationSeconds : 0.35
        return p + step
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [
    isPlaying,
    episode,
    currentIndex,
    episodes.length,
    onIndexChange,
    episode?.audioUrl,
    isVideo,
    singleEpisode,
  ])

  useEffect(() => {
    setProgress(8)
    setIsPlaying(true)
  }, [currentIndex])

  if (!episode) return null

  const castStreamUrl = isVideo ? episode.videoUrl : episode.audioUrl
  const castMedia = castStreamUrl
    ? {
        title: episode.title,
        subtitle: episode.podcast,
        streamUrl: castStreamUrl,
        posterUrl: episode.cover,
      }
    : null
  const getCastCurrentTime = () => {
    if (isVideo) return videoRef.current?.currentTime ?? 0
    return audioRef.current?.currentTime ?? 0
  }
  const pauseLocalPlayback = () => {
    if (isVideo) {
      const el = videoRef.current
      if (el && !el.paused) el.pause()
      return
    }
    const el = audioRef.current
    if (el && !el.paused) el.pause()
    setIsPlaying(false)
  }

  const goPrev = () => {
    if (currentIndex > 0) onIndexChange(currentIndex - 1)
  }
  const goNext = () => {
    if (currentIndex < episodes.length - 1) onIndexChange(currentIndex + 1)
  }

  const videoPlayer =
    isVideo && episode.videoUrl ? (
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
          if (!singleEpisode && currentIndex < episodes.length - 1) onIndexChange(currentIndex + 1)
          else setIsPlaying(false)
        }}
      />
    ) : null

  return (
    <>
      {videoPlayer && inlineVideo ? (
        <div className="w-full max-w-2xl mx-auto mb-6 aspect-video rounded-2xl overflow-hidden bg-black shadow-xl border border-border">
          {videoPlayer}
        </div>
      ) : null}

      {videoPlayer && !inlineVideo ? (
        <div className="fixed left-0 right-0 md:left-20 z-[45] bottom-[calc(7.5rem+env(safe-area-inset-bottom))] md:bottom-[4.75rem] px-3 md:px-6 pointer-events-none">
          <div className="max-w-2xl mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-border pointer-events-auto relative">
            {videoPlayer}
            <div className="absolute top-2 right-2">
              <CastMediaButton
                variant="on-video"
                media={castMedia}
                getCurrentTime={getCastCurrentTime}
                onCastStarted={pauseLocalPlayback}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-16 md:bottom-0 md:left-20 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
        {episode.audioUrl && !isVideo ? (
          <audio
            ref={audioRef}
            className="hidden"
            onTimeUpdate={() => {
              const audio = audioRef.current
              if (!audio?.duration) return
              setProgress((audio.currentTime / audio.duration) * 100)
            }}
            onEnded={() => {
              if (!singleEpisode && currentIndex < episodes.length - 1) onIndexChange(currentIndex + 1)
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
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          {!singleEpisode ? (
            <Link href={`/podcast/${episode.id}`}>
              <img
                src={episode.cover}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 hover:opacity-90"
              />
            </Link>
          ) : (
            <img
              src={episode.cover}
              alt=""
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {episode.title}
              {isVideo ? (
                <span className="ml-1.5 text-[10px] font-medium text-primary/80">Video</span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground truncate">{episode.podcast}</p>
          </div>
          <div className="flex items-center gap-1">
            <CastMediaButton
              variant="compact"
              media={castMedia}
              getCurrentTime={getCastCurrentTime}
              onCastStarted={pauseLocalPlayback}
            />
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  onAuthRequired()
                  return
                }
                onToggleLike(episode.id)
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
            {!singleEpisode && (
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <SkipBack className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-white" />
              )}
            </button>
            {!singleEpisode && (
              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex >= episodes.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMuted(!muted)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
