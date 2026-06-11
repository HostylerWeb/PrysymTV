"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import Link from "next/link"
import {
  buildAdAttribution,
  fetchServedAd,
  trackAdClick,
  trackAdImpression,
  type ServedAd,
} from "@/lib/api/ads"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"
import { useAuth } from "@/contexts/auth-context"

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
  const showAds = useShouldShowAds()
  const { user } = useAuth()
  const { isPlacementEnabled, platformCreatorId } = usePublicAdsConfig()
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined)
  const [countdown, setCountdown] = useState(15)
  const [canSkip, setCanSkip] = useState(skippable)
  const videoRef = useRef<HTMLVideoElement>(null)

  const placementEnabled = isPlacementEnabled("movie_preroll")

  useEffect(() => {
    if (!showAds || !placementEnabled) {
      setAd(null)
      onComplete()
      return
    }
    void fetchServedAd("movie_preroll").then((served) => {
      setAd(served)
      if (!served) onComplete()
    })
  }, [showAds, placementEnabled, onComplete])

  useEffect(() => {
    if (!ad) return
    setCountdown(ad.skipAfterSeconds || 15)
    const attr = buildAdAttribution({
      campaignId: ad.id,
      placement: "movie_preroll",
      creatorId,
      platformCreatorId,
      videoId,
      viewerUserId: user?.id,
    })
    void trackAdImpression(attr)
  }, [ad, creatorId, platformCreatorId, videoId, user?.id])

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

  const attr = buildAdAttribution({
    campaignId: ad.id,
    placement: "movie_preroll",
    creatorId,
    platformCreatorId,
    videoId,
    viewerUserId: user?.id,
  })

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
            void trackAdClick(attr)
          }}
        >
          {ad.title}
        </Link>
      </div>
    </div>
  )
}
