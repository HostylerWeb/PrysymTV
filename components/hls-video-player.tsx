"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { VideoQualityMenu } from "@/components/video-quality-menu"
import {
  labelForHeight,
  type HlsQualityControl,
  type HlsQualityLevel,
} from "@/lib/hls-quality"

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
}: HlsVideoPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalRef ?? internalRef
  const hlsRef = useRef<Hls | null>(null)
  const [qualityControl, setQualityControl] = useState<HlsQualityControl | null>(
    null,
  )

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
      const levels = buildLevels(hls)
      if (levels.length <= 1) {
        publishQualityControl(null)
        return
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
    [buildLevels, publishQualityControl],
  )

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src) return

    let hls: Hls | null = null
    let cancelled = false

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
      publishQualityControl(null)
    }

    return () => {
      cancelled = true
      hlsRef.current = null
      hls?.destroy()
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
    const el = videoRef.current
    if (!el) return
    const onTime = () => onTimeUpdate?.(el.currentTime, el.duration || 0)
    const onEnd = () => onEnded?.()
    const onPlayEvt = () => onPlay?.()
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("ended", onEnd)
    el.addEventListener("play", onPlayEvt)
    return () => {
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("ended", onEnd)
      el.removeEventListener("play", onPlayEvt)
    }
  }, [onPlay, onTimeUpdate, onEnded, videoRef])

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

  const showBuiltInQuality =
    showQualitySelector && !onQualityControlReady && qualityControl

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={className ?? "w-full h-full object-contain"}
        poster={poster ?? undefined}
        controls={controls}
        controlsList={disableNativeFullscreen ? "nofullscreen noremoteplayback" : undefined}
        disablePictureInPicture={disableNativeFullscreen}
        muted={muted}
        playsInline={playsInline}
        loop={loop}
      />
      {showBuiltInQuality ? (
        <div className="absolute bottom-12 right-3 z-20 pointer-events-auto">
          <VideoQualityMenu control={qualityControl} variant="overlay" />
        </div>
      ) : null}
    </div>
  )
}
