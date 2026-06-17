"use client"

import { useEffect, useRef, useState } from "react"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import { liveStreamPosterUrl } from "@/lib/format-media"

type LiveStreamThumbnailProps = {
  title: string
  className?: string
  hlsPlaybackUrl?: string | null
  thumbnailUrl?: string | null
  streamerAvatar?: string | null
  streamerSlug?: string | null
  streamer?: string | null
}

/**
 * Live browse thumbnail: real HLS preview when the stream is on air (YouTube-style),
 * static poster fallback before signal or when off-screen.
 */
export function LiveStreamThumbnail({
  title,
  className = "w-full h-full object-cover",
  hlsPlaybackUrl,
  thumbnailUrl,
  streamerAvatar,
  streamerSlug,
  streamer,
}: LiveStreamThumbnailProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  const poster = liveStreamPosterUrl({
    thumbnailUrl,
    streamerAvatar,
    streamerSlug,
    streamer,
  })
  const hls = hlsPlaybackUrl?.trim() || null
  const showLivePreview = Boolean(hls && inView)

  useEffect(() => {
    const el = rootRef.current
    if (!el || !hls) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "80px", threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hls])

  return (
    <div ref={rootRef} className="relative w-full h-full bg-zinc-900 overflow-hidden">
      <img
        src={poster}
        alt={title}
        className={className}
        loading="lazy"
      />
      {showLivePreview && (
        <HlsVideoPlayer
          src={hls}
          poster={poster}
          className={`absolute inset-0 ${className}`}
          autoPlay
          muted
          playsInline
          controls={false}
          liveLowLatency
        />
      )}
    </div>
  )
}
