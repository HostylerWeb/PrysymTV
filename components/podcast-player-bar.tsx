"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Heart,
  Maximize,
  Minimize2,
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
import { VideoQualityMenu } from "@/components/video-quality-menu"
import type { PodcastEpisodeCard } from "@/lib/api/podcasts"
import type { HlsQualityControl } from "@/lib/hls-quality"
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
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [qualityControl, setQualityControl] = useState<HlsQualityControl | null>(null)
  const [showVideoControls, setShowVideoControls] = useState(true)
  const [videoFullscreen, setVideoFullscreen] = useState(false)
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
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(true)
    setQualityControl(null)
  }, [currentIndex])

  useEffect(() => {
    const onFullscreenChange = () => {
      const root = videoContainerRef.current
      setVideoFullscreen(Boolean(root && document.fullscreenElement === root))
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  const togglePlay = useCallback(() => {
    if (isVideo) {
      const el = videoRef.current
      if (!el) return
      if (el.paused) {
        void el.play().then(() => setIsPlaying(true)).catch(() => {})
      } else {
        el.pause()
        setIsPlaying(false)
      }
      return
    }
    setIsPlaying((p) => !p)
  }, [isVideo])

  const seekToFraction = useCallback(
    (fraction: number) => {
      const clamped = Math.min(1, Math.max(0, fraction))
      if (isVideo) {
        const el = videoRef.current
        const d = el?.duration || duration
        if (!el || !d) return
        el.currentTime = clamped * d
        setProgress(clamped * 100)
        setCurrentTime(el.currentTime)
        return
      }
      const audio = audioRef.current
      if (!audio?.duration) {
        setProgress(clamped * 100)
        return
      }
      audio.currentTime = clamped * audio.duration
      setProgress(clamped * 100)
    },
    [duration, isVideo],
  )

  const toggleVideoFullscreen = useCallback(() => {
    const root = videoContainerRef.current
    if (!root) return
    if (document.fullscreenElement === root) {
      void document.exitFullscreen()
      return
    }
    void root.requestFullscreen().catch(() => {})
  }, [])

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
      setIsPlaying(false)
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

  const videoProgress = duration > 0 ? (currentTime / duration) * 100 : progress

  const videoStage = isVideo && episode.videoUrl ? (
    <div
      ref={videoContainerRef}
      className="relative w-full aspect-video bg-black group"
      onMouseEnter={() => setShowVideoControls(true)}
      onMouseLeave={() => setShowVideoControls(false)}
      onClick={() => {
        setShowVideoControls(true)
        togglePlay()
      }}
    >
      <HlsVideoPlayer
        key={episode.id}
        src={episode.videoUrl}
        poster={episode.cover}
        className="w-full h-full object-contain pointer-events-none"
        controls={false}
        onQualityControlReady={setQualityControl}
        playsInline
        videoRef={videoRef}
        muted={muted}
        autoPlay
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(t, d) => {
          setCurrentTime(t)
          setDuration(d)
          if (d > 0) setProgress((t / d) * 100)
        }}
        onEnded={() => {
          if (!singleEpisode && currentIndex < episodes.length - 1) onIndexChange(currentIndex + 1)
          else setIsPlaying(false)
        }}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center border border-white/30">
            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
      <div
        className={cn(
          "absolute inset-0 transition-opacity pointer-events-none",
          showVideoControls ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
          <div
            className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              seekToFraction((e.clientX - rect.left) / rect.width)
            }}
          >
            <div className="h-full bg-primary rounded-full" style={{ width: `${videoProgress}%` }} />
          </div>
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button type="button" onClick={(e) => { e.stopPropagation(); togglePlay() }}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setMuted((m) => !m)
                }}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <VideoQualityMenu control={qualityControl} variant="compact" />
            </div>
            <div className="flex items-center gap-2">
              <CastMediaButton
                variant="compact"
                media={castMedia}
                getCurrentTime={getCastCurrentTime}
                onCastStarted={pauseLocalPlayback}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleVideoFullscreen()
                }}
                aria-label={videoFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {videoFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {videoStage && inlineVideo ? (
        <div className="w-full max-w-3xl mx-auto mb-6 rounded-2xl overflow-hidden bg-black shadow-xl border border-border">
          {videoStage}
        </div>
      ) : null}

      <div className="fixed bottom-16 md:bottom-0 md:left-20 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
        {videoStage && !inlineVideo ? videoStage : null}

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

        {!isVideo ? (
          <div
            className="w-full h-1 bg-border cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              seekToFraction((e.clientX - rect.left) / rect.width)
            }}
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}

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
                <span className="ml-1.5 text-[10px] font-medium text-primary">Video</span>
              ) : (
                <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">Audio</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">{episode.podcast}</p>
          </div>
          <div className="flex items-center gap-1">
            {!isVideo ? (
              <CastMediaButton
                variant="compact"
                media={castMedia}
                getCurrentTime={getCastCurrentTime}
                onCastStarted={pauseLocalPlayback}
              />
            ) : null}
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
            {!isVideo ? (
              <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5 fill-white" />
                )}
              </button>
            ) : null}
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
            {!isVideo ? (
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
