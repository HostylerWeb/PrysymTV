"use client"

import { useEffect, useRef } from "react"
import { resolveAdMediaUrl } from "@/lib/ad-media"

type Props = {
  mediaUrl: string
  mediaType: "image" | "video"
  alt?: string
  className?: string
  onReady: () => void
  onError: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

export function AdMediaDisplay({
  mediaUrl,
  mediaType,
  alt,
  className,
  onReady,
  onError,
  onEnded,
  onTimeUpdate,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const resolved = resolveAdMediaUrl(mediaUrl)

  useEffect(() => {
    if (mediaType !== "video" || !resolved) return
    const el = videoRef.current
    if (!el) return

    const tryPlay = () => {
      el.muted = true
      void el.play().catch(() => {})
    }

    el.load()
    el.addEventListener("canplay", tryPlay)
    tryPlay()

    return () => {
      el.removeEventListener("canplay", tryPlay)
    }
  }, [resolved, mediaType])

  if (!resolved) {
    return null
  }

  if (mediaType === "video") {
    return (
      <video
        ref={videoRef}
        src={resolved}
        className={className}
        autoPlay
        muted
        playsInline
        preload="auto"
        onPlaying={onReady}
        onEnded={onEnded}
        onError={onError}
        onTimeUpdate={() => {
          const el = videoRef.current
          if (!el) return
          onTimeUpdate?.(el.currentTime, el.duration)
        }}
        onLoadedMetadata={() => {
          const el = videoRef.current
          if (!el) return
          onTimeUpdate?.(el.currentTime, el.duration)
        }}
      />
    )
  }

  return (
    <img
      src={resolved}
      alt={alt ?? ""}
      className={className}
      onLoad={onReady}
      onError={onError}
    />
  )
}
