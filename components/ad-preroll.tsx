"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import Link from "next/link"
import {
  fetchServedAd,
  trackAdClick,
  trackAdImpression,
  type AdAttribution,
  type ServedAd,
} from "@/lib/api/ads"

interface AdPrerollProps {
  onComplete: () => void
  skippable?: boolean
  creatorId?: string
  videoId?: string
}

export function AdPreroll({
  onComplete,
  skippable = false,
  creatorId,
  videoId,
}: AdPrerollProps) {
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined)
  const [countdown, setCountdown] = useState(15)
  const [canSkip, setCanSkip] = useState(skippable)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    void fetchServedAd("movie_preroll").then(setAd)
  }, [])

  useEffect(() => {
    if (!ad) return
    setCountdown(ad.skipAfterSeconds || 15)
    if (creatorId) {
      void trackAdImpression({
        campaignId: ad.id,
        placement: "movie_preroll",
        creatorId,
        videoId,
      })
    }
  }, [ad, creatorId, videoId])

  useEffect(() => {
    if (ad === undefined) return
    if (ad === null) {
      onComplete()
      return
    }
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
  }, [ad, countdown, skippable, onComplete])

  if (ad === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <p className="text-white/70 text-sm">Loading…</p>
      </div>
    )
  }

  if (!ad) return null

  const attr: AdAttribution = {
    campaignId: ad.id,
    placement: "movie_preroll",
    creatorId,
    videoId,
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-5xl aspect-video">
        <video
          ref={videoRef}
          src={ad.mediaUrl}
          className="w-full h-full object-contain"
          autoPlay
          muted
          playsInline
          onEnded={onComplete}
        />
        {canSkip && (
          <button
            type="button"
            onClick={onComplete}
            className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
          >
            Skip <X className="w-4 h-4" />
          </button>
        )}
        {!canSkip && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
            Skip in {countdown}s
          </div>
        )}
        <Link
          href={ad.clickThroughUrl}
          className="absolute bottom-4 left-4 text-white/80 text-sm underline"
          onClick={() => {
            if (creatorId) void trackAdClick(attr)
          }}
        >
          {ad.title}
        </Link>
      </div>
    </div>
  )
}
