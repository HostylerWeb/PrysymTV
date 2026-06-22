"use client"

import { useEffect, useRef } from "react"
import Hls from "hls.js"

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
  onPlay?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
  /** Block iOS/Safari native video fullscreen (prevents rotation conflicts on mobile). */
  disableNativeFullscreen?: boolean
  /** Called when native fullscreen was blocked so the app can enter CSS immersive mode. */
  onNativeFullscreenBlocked?: () => void
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
  onPlay,
  onTimeUpdate,
  onEnded,
  videoRef: externalRef,
  disableNativeFullscreen = false,
  onNativeFullscreenBlocked,
}: HlsVideoPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalRef ?? internalRef

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
      hls.attachMedia(el)
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(src)
      })
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (live || liveLowLatency) hls?.startLoad(-1)
        tryPlay()
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
    } else {
      el.src = src
      tryPlay()
    }

    return () => {
      cancelled = true
      hls?.destroy()
    }
  }, [src, autoPlay, live, liveLowLatency, videoRef])

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

  return (
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
  )
}
