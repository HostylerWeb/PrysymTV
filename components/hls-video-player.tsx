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
  onPlay?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  videoRef?: React.RefObject<HTMLVideoElement | null>
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
  onPlay,
  onTimeUpdate,
  onEnded,
  videoRef: externalRef,
}: HlsVideoPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalRef ?? internalRef

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src) return

    let hls: Hls | null = null

    const isHls = src.includes(".m3u8")

    if (isHls && Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(el)
    } else if (isHls && el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = src
    } else {
      el.src = src
    }

    if (autoPlay) {
      void el.play().catch(() => {})
    }

    return () => {
      hls?.destroy()
    }
  }, [src, autoPlay, videoRef])

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
      muted={muted}
      playsInline={playsInline}
      loop={loop}
    />
  )
}
