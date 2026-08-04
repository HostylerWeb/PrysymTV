"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import {
  Maximize,
  Minimize2,
  MoreVertical,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react"
import { VideoQualityMenu } from "@/components/video-quality-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  labelForHeight,
  type HlsQualityControl,
  type HlsQualityLevel,
} from "@/lib/hls-quality"

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

type HlsVideoPlayerProps = {
  src: string | null | undefined
  poster?: string | null
  className?: string
  autoPlay?: boolean
  controls?: boolean
  muted?: boolean
  playsInline?: boolean
  loop?: boolean
  /** Standard live HLS (~6–10s). */
  live?: boolean
  /** LL-HLS fallback when WebRTC is unavailable (~2–4s). */
  liveLowLatency?: boolean
  /** Show manual quality picker when multiple HLS renditions exist (VOD). */
  showQualitySelector?: boolean
  onPlay?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
  /** Block iOS/Safari native video fullscreen (prevents rotation conflicts on mobile). */
  disableNativeFullscreen?: boolean
  /** Called when native fullscreen was blocked so the app can enter CSS immersive mode. */
  onNativeFullscreenBlocked?: () => void
  /** Exposes quality API for custom player chrome (e.g. watch page controls). */
  onQualityControlReady?: (control: HlsQualityControl | null) => void
  /** Custom fullscreen (e.g. CSS immersive) when native fullscreen is disabled. */
  fullscreenActive?: boolean
  onFullscreenToggle?: () => void
}

export function HlsVideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  controls = true,
  muted = false,
  playsInline = true,
  loop = false,
  live = false,
  liveLowLatency = false,
  showQualitySelector = false,
  onPlay,
  onTimeUpdate,
  onEnded,
  videoRef: externalRef,
  disableNativeFullscreen = false,
  onNativeFullscreenBlocked,
  onQualityControlReady,
  fullscreenActive,
  onFullscreenToggle,
}: HlsVideoPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalRef ?? internalRef
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [qualityControl, setQualityControl] = useState<HlsQualityControl | null>(
    null,
  )
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFullscreen = onFullscreenToggle ? (fullscreenActive ?? false) : isFullscreen

  const revealControlsFS = useCallback(() => {
    if (!activeFullscreen) return
    setControlsVisible(true)
    if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current)
    controlsHideTimerRef.current = setTimeout(() => setControlsVisible(false), 3500)
  }, [activeFullscreen])

  useEffect(() => {
    if (activeFullscreen) {
      controlsHideTimerRef.current = setTimeout(() => setControlsVisible(false), 2000)
    } else {
      setControlsVisible(true)
      if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current)
    }
    return () => { if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current) }
  }, [activeFullscreen])

  const useIntegratedControls =
    showQualitySelector && !onQualityControlReady

  const publishQualityControl = useCallback(
    (control: HlsQualityControl | null) => {
      setQualityControl(control)
      onQualityControlReady?.(control)
    },
    [onQualityControlReady],
  )

  const buildLevels = useCallback((hls: Hls): HlsQualityLevel[] => {
    return hls.levels
      .map((level, index) => ({
        index,
        height: level.height,
        label: labelForHeight(level.height),
      }))
      .filter((level) => level.height > 0)
      .sort((a, b) => b.height - a.height)
  }, [])

  const syncQualityControl = useCallback(
    (hls: Hls) => {
      let levels = buildLevels(hls)
      if (levels.length === 0) {
        const el = videoRef.current
        const height = el?.videoHeight ?? 0
        if (height > 0) {
          levels = [{ index: 0, height, label: labelForHeight(height) }]
        } else {
          publishQualityControl(null)
          return
        }
      }

      publishQualityControl({
        levels,
        currentLevel: hls.currentLevel,
        setLevel: (levelIndex: number) => {
          const instance = hlsRef.current
          if (!instance) return
          instance.currentLevel = levelIndex
          syncQualityControl(instance)
        },
      })
    },
    [buildLevels, publishQualityControl, videoRef],
  )

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src) return

    let hls: Hls | null = null
    let cancelled = false
    let onVideoMetadata: (() => void) | null = null

    const isHls = src.includes(".m3u8")

    const tryPlay = () => {
      if (!autoPlay || cancelled) return
      void el.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
      })
    }

    publishQualityControl(null)

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        ...(liveLowLatency
          ? {
              lowLatencyMode: true,
              liveSyncDuration: 1,
              liveMaxLatencyDuration: 5,
              maxLiveSyncPlaybackRate: 1.15,
              backBufferLength: 6,
              maxBufferLength: 10,
              maxMaxBufferLength: 15,
            }
          : live
            ? {
                lowLatencyMode: false,
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 12,
                maxLiveSyncPlaybackRate: 1,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                backBufferLength: 30,
              }
            : {
                maxBufferLength: 60,
                backBufferLength: 30,
              }),
      })
      hlsRef.current = hls
      hls.attachMedia(el)
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(src)
      })
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (live || liveLowLatency) hls?.startLoad(-1)
        if (hls && !live && !liveLowLatency) syncQualityControl(hls)
        tryPlay()
      })
      hls.on(Hls.Events.LEVEL_SWITCHED, () => {
        if (hls && !live && !liveLowLatency) syncQualityControl(hls)
      })
      onVideoMetadata = () => {
        if (hls && !live && !liveLowLatency) syncQualityControl(hls)
      }
      el.addEventListener("loadedmetadata", onVideoMetadata)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!hls || data.fatal === false) return
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad()
          return
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError()
        }
      })
    } else if (isHls && el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src
      el.addEventListener("loadedmetadata", tryPlay, { once: true })
      publishQualityControl(null)
    } else {
      el.src = src
      tryPlay()
      const onNativeMetadata = () => {
        const height = el.videoHeight ?? 0
        if (height <= 0) {
          publishQualityControl(null)
          return
        }
        publishQualityControl({
          levels: [{ index: 0, height, label: labelForHeight(height) }],
          currentLevel: 0,
          setLevel: () => {},
        })
      }
      el.addEventListener("loadedmetadata", onNativeMetadata)
      onVideoMetadata = onNativeMetadata
    }

    return () => {
      cancelled = true
      hlsRef.current = null
      hls?.destroy()
      if (onVideoMetadata) {
        el.removeEventListener("loadedmetadata", onVideoMetadata)
      }
      publishQualityControl(null)
    }
  }, [
    src,
    autoPlay,
    live,
    liveLowLatency,
    videoRef,
    syncQualityControl,
    publishQualityControl,
  ])

  useEffect(() => {
    setIsMuted(muted)
    const el = videoRef.current
    if (el) el.muted = muted
  }, [muted, videoRef])

  useEffect(() => {
    const onFullscreenChange = () => {
      const root = containerRef.current
      setIsFullscreen(Boolean(root && document.fullscreenElement === root))
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onTime = () => {
      const t = el.currentTime
      const d = el.duration || 0
      setCurrentTime(t)
      setDuration(d)
      onTimeUpdate?.(t, d)
    }
    const onEnd = () => {
      setIsPlaying(false)
      onEnded?.()
    }
    const onPlayEvt = () => {
      setIsPlaying(true)
      onPlay?.()
    }
    const onPauseEvt = () => setIsPlaying(false)
    const onLoadedMetadata = () => setDuration(el.duration || 0)
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("ended", onEnd)
    el.addEventListener("play", onPlayEvt)
    el.addEventListener("pause", onPauseEvt)
    el.addEventListener("loadedmetadata", onLoadedMetadata)
    return () => {
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("ended", onEnd)
      el.removeEventListener("play", onPlayEvt)
      el.removeEventListener("pause", onPauseEvt)
      el.removeEventListener("loadedmetadata", onLoadedMetadata)
    }
  }, [onPlay, onTimeUpdate, onEnded, videoRef, src])

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) void el.play().catch(() => {})
    else el.pause()
  }, [videoRef])

  const toggleMute = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setIsMuted(el.muted)
  }, [videoRef])

  const toggleFullscreen = useCallback(() => {
    const root = containerRef.current
    if (!root) return
    if (document.fullscreenElement === root) {
      void document.exitFullscreen()
      return
    }
    void root.requestFullscreen().catch(() => {})
  }, [])

  const seekToFraction = useCallback(
    (fraction: number) => {
      const el = videoRef.current
      if (!el || !duration) return
      el.currentTime = Math.max(0, Math.min(duration, fraction * duration))
    },
    [duration, videoRef],
  )

  const setRate = useCallback(
    (rate: number) => {
      const el = videoRef.current
      if (!el) return
      el.playbackRate = rate
      setPlaybackRate(rate)
    },
    [videoRef],
  )

  useEffect(() => {
    const el = videoRef.current
    if (!el || !disableNativeFullscreen) return

    const blockNativeFullscreen = (e: Event) => {
      e.preventDefault()
      onNativeFullscreenBlocked?.()
    }

    el.setAttribute("playsinline", "true")
    el.setAttribute("webkit-playsinline", "true")
    el.addEventListener("webkitbeginfullscreen", blockNativeFullscreen)

    const onDocumentFullscreen = () => {
      if (document.fullscreenElement === el) {
        void document.exitFullscreen()
        onNativeFullscreenBlocked?.()
      }
    }
    document.addEventListener("fullscreenchange", onDocumentFullscreen)

    return () => {
      el.removeEventListener("webkitbeginfullscreen", blockNativeFullscreen)
      document.removeEventListener("fullscreenchange", onDocumentFullscreen)
    }
  }, [disableNativeFullscreen, onNativeFullscreenBlocked, videoRef, src])

  if (!src) {
    return (
      <div className={className ?? "w-full h-full bg-black flex items-center justify-center text-white/60"}>
        Video unavailable
      </div>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const showNativeControls = controls && !useIntegratedControls

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full group"
      onMouseMove={revealControlsFS}
    >
      <video
        ref={videoRef}
        className={className ?? "w-full h-full object-contain"}
        poster={poster ?? undefined}
        controls={showNativeControls}
        controlsList={disableNativeFullscreen ? "nofullscreen noremoteplayback" : undefined}
        disablePictureInPicture={disableNativeFullscreen}
        muted={isMuted}
        playsInline={playsInline}
        loop={loop}
        onClick={
          useIntegratedControls
            ? () => { revealControlsFS(); togglePlay() }
            : undefined
        }
      />
      {useIntegratedControls ? (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 pointer-events-none bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-10 transition-opacity duration-300",
            activeFullscreen && !controlsVisible ? "opacity-0" : "opacity-100",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-auto px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              className="mb-2 block h-1 w-full cursor-pointer rounded-full bg-white/30"
              aria-label="Seek"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                seekToFraction((e.clientX - rect.left) / rect.width)
              }}
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </button>
            <div className="flex items-center justify-between gap-2 text-white">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 fill-white" />
                  )}
                </button>
                <span className="truncate text-[11px] tabular-nums text-white/90">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <VideoQualityMenu control={qualityControl} variant="compact" />
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                {!disableNativeFullscreen || onFullscreenToggle ? (
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center"
                    onClick={onFullscreenToggle ?? toggleFullscreen}
                    aria-label={
                      (onFullscreenToggle ? fullscreenActive : isFullscreen)
                        ? "Exit fullscreen"
                        : "Fullscreen"
                    }
                  >
                    {(onFullscreenToggle ? fullscreenActive : isFullscreen) ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </button>
                ) : null}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center"
                      aria-label="More options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    side="top"
                    className="w-44 p-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Playback speed
                    </p>
                    {PLAYBACK_RATES.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setRate(rate)}
                        className={cn(
                          "w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                          playbackRate === rate && "bg-accent font-medium",
                        )}
                      >
                        {rate === 1 ? "Normal" : `${rate}x`}
                      </button>
                    ))}
                    {!disableNativeFullscreen &&
                    typeof document !== "undefined" &&
                    document.pictureInPictureEnabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          const el = videoRef.current
                          if (!el) return
                          if (document.pictureInPictureElement === el) {
                            void document.exitPictureInPicture()
                            return
                          }
                          void el.requestPictureInPicture().catch(() => {})
                        }}
                        className="mt-1 w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                      >
                        Picture in picture
                      </button>
                    ) : null}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
