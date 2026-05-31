"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { getAd } from "@/lib/mock-data"
import Link from "next/link"

interface AdPrerollProps {
  onComplete: () => void
  skippable?: boolean
}

export function AdPreroll({ onComplete, skippable = false }: AdPrerollProps) {
  const ad = getAd("movie_preroll")
  const [countdown, setCountdown] = useState(ad?.skipAfterSeconds ?? 15)
  const [canSkip, setCanSkip] = useState(skippable)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (skippable) {
      setCanSkip(true)
      return
    }
    if (countdown <= 0) {
      setCanSkip(true)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, skippable])

  if (!ad) {
    onComplete()
    return null
  }

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-black/80">
        <span className="text-xs text-white/70">Ad · {ad.title}</span>
        {canSkip ? (
          <button onClick={onComplete} className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">
            Skip Ad
          </button>
        ) : (
          <span className="text-xs text-white/70">Skip in {countdown}s</span>
        )}
      </div>
      <video
        ref={videoRef}
        src={ad.mediaUrl}
        autoPlay
        muted
        playsInline
        className="flex-1 w-full object-contain"
        onEnded={onComplete}
      />
      <Link href={ad.clickThroughUrl} className="text-center py-2 text-xs text-primary">
        Learn more
      </Link>
    </div>
  )
}
