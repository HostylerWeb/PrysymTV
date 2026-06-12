"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X } from "lucide-react"
import {
  buildAdAttribution,
  fetchServedAd,
  openAdDestination,
  trackAdImpression,
  type ServedAd,
} from "@/lib/api/ads"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"
import { useAuth } from "@/contexts/auth-context"

function isValidServedAd(ad: ServedAd | null | undefined): ad is ServedAd {
  return Boolean(ad?.mediaUrl?.trim())
}

interface AdPrerollProps {
  onComplete: () => void
  skippable?: boolean
  creatorId?: string
  videoId?: string
  /** When provided, skips the serve request (parent already fetched). */
  servedAd?: ServedAd
}

export function AdPreroll({
  onComplete,
  skippable = false,
  creatorId,
  videoId,
  servedAd,
}: AdPrerollProps) {
  const showAds = useShouldShowAds()
  const { user } = useAuth()
  const { isPlacementEnabled, platformCreatorId } = usePublicAdsConfig()
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const finishedRef = useRef(false)

  const complete = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onCompleteRef.current()
  }, [])

  const [ad, setAd] = useState<ServedAd | null | undefined>(
    servedAd !== undefined
      ? isValidServedAd(servedAd)
        ? servedAd
        : null
      : undefined,
  )
  const [mediaReady, setMediaReady] = useState(false)
  const [countdown, setCountdown] = useState(15)
  const [canSkip, setCanSkip] = useState(skippable)

  const placementEnabled = isPlacementEnabled("movie_preroll")

  useEffect(() => {
    finishedRef.current = false
    setMediaReady(false)
  }, [servedAd?.id])

  useEffect(() => {
    if (servedAd !== undefined) {
      const valid = isValidServedAd(servedAd) ? servedAd : null
      setAd(valid)
      if (!valid) complete()
      return
    }

    if (!showAds || !placementEnabled) {
      setAd(null)
      complete()
      return
    }

    void fetchServedAd("movie_preroll").then((served) => {
      const valid = isValidServedAd(served) ? served : null
      setAd(valid)
      if (!valid) complete()
    })
  }, [showAds, placementEnabled, servedAd, complete])

  useEffect(() => {
    if (!ad) return
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
    if (!ad || !mediaReady) return
    setCountdown(ad.skipAfterSeconds || 15)
  }, [ad, mediaReady])

  useEffect(() => {
    if (!ad || !mediaReady) return
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
  }, [ad, mediaReady, countdown, skippable])

  useEffect(() => {
    if (!ad) return
    const t = setTimeout(() => {
      if (!mediaReady) complete()
    }, 5000)
    return () => clearTimeout(t)
  }, [ad, mediaReady, complete])

  if (ad === undefined) return null
  if (!ad) return null

  const attr = buildAdAttribution({
    campaignId: ad.id,
    placement: "movie_preroll",
    creatorId,
    platformCreatorId,
    videoId,
    viewerUserId: user?.id,
  })

  const markReady = () => setMediaReady(true)

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-5xl aspect-video">
        {ad.mediaType === "image" ? (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="w-full h-full object-contain"
            onLoad={markReady}
            onError={complete}
          />
        ) : (
          <video
            src={ad.mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
            onPlaying={markReady}
            onCanPlay={markReady}
            onEnded={complete}
            onError={complete}
          />
        )}
        {mediaReady && canSkip && (
          <button
            type="button"
            onClick={complete}
            className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
          >
            Skip <X className="w-4 h-4" />
          </button>
        )}
        {mediaReady && !canSkip && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
            Skip in {countdown}s
          </div>
        )}
        {mediaReady && (
          <a
            href={ad.clickThroughUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-4 text-white/80 text-sm underline"
            onClick={(e) => {
              e.preventDefault()
              openAdDestination(ad.clickThroughUrl, attr)
            }}
          >
            {ad.title}
          </a>
        )}
      </div>
    </div>
  )
}
