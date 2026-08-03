"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  buildAdAttribution,
  fetchServedAd,
  openAdDestination,
  trackAdImpression,
  type ServedAd,
} from "@/lib/api/ads"
import { AdMediaDisplay } from "@/components/ad-media-display"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"
import { useAuth } from "@/contexts/auth-context"
import {
  canSkipImageAd,
  canSkipVideoAd,
  POST_END_SKIP_MS,
  videoAdSkipSecondsRemaining,
} from "@/lib/ad-skip-timing"

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
  /** `inline` fills the parent player frame (YouTube-style). `fullscreen` covers the viewport. */
  variant?: "fullscreen" | "inline"
}

export function AdPreroll({
  onComplete,
  skippable = false,
  creatorId,
  videoId,
  servedAd,
  variant = "fullscreen",
}: AdPrerollProps) {
  const showAds = useShouldShowAds()
  const { user } = useAuth()
  const { isPlacementEnabled, platformCreatorId } = usePublicAdsConfig()
  const onCompleteRef = useRef(onComplete)
  const finishedRef = useRef(false)
  const postEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  onCompleteRef.current = onComplete

  const complete = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (postEndTimerRef.current) {
      clearTimeout(postEndTimerRef.current)
      postEndTimerRef.current = null
    }
    onCompleteRef.current()
  }, [])

  const schedulePostEndSkip = useCallback(() => {
    if (postEndTimerRef.current) clearTimeout(postEndTimerRef.current)
    postEndTimerRef.current = setTimeout(() => {
      postEndTimerRef.current = null
      complete()
    }, POST_END_SKIP_MS)
  }, [complete])

  const [ad, setAd] = useState<ServedAd | null | undefined>(
    servedAd !== undefined
      ? isValidServedAd(servedAd)
        ? servedAd
        : null
      : undefined,
  )
  const [mediaReady, setMediaReady] = useState(false)
  const [imageCountdown, setImageCountdown] = useState(5)
  const [adCurrentTime, setAdCurrentTime] = useState(0)
  const [adDuration, setAdDuration] = useState(0)

  const placementEnabled = isPlacementEnabled("movie_preroll")
  const inline = variant === "inline"
  const isVideoAd = ad?.mediaType === "video"

  useEffect(() => {
    finishedRef.current = false
    setMediaReady(false)
    setAdCurrentTime(0)
    setAdDuration(0)
  }, [servedAd?.id])

  useEffect(() => {
    return () => {
      if (postEndTimerRef.current) clearTimeout(postEndTimerRef.current)
    }
  }, [])

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
    if (!ad || !mediaReady || isVideoAd) return
    setImageCountdown(ad.skipAfterSeconds || 5)
  }, [ad, mediaReady, isVideoAd])

  useEffect(() => {
    if (!ad || !mediaReady || isVideoAd || skippable) return
    if (imageCountdown <= 0) return
    const t = setTimeout(() => setImageCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [ad, mediaReady, imageCountdown, skippable, isVideoAd])

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

  const canSkip = isVideoAd
    ? canSkipVideoAd(mediaReady, adCurrentTime, adDuration, skippable)
    : canSkipImageAd(mediaReady, imageCountdown) || skippable

  const skipLabel = (() => {
    if (!mediaReady) return "Loading…"
    if (canSkip) return null
    if (isVideoAd) {
      if (adDuration <= 0) return "Loading…"
      const remaining = videoAdSkipSecondsRemaining(adCurrentTime, adDuration)
      return `Skip in ${remaining}s`
    }
    return `Skip in ${imageCountdown}s`
  })()

  const shellClass = inline
    ? "absolute inset-0 z-50 flex flex-col bg-black"
    : "fixed inset-0 z-50 bg-black flex items-center justify-center"

  const mediaWrapClass = inline
    ? "relative flex-1 min-h-0 w-full"
    : "relative w-full max-w-5xl aspect-video"

  return (
    <div className={shellClass}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          type="button"
          className="text-xs text-white/70 hover:text-white underline shrink-0"
          onClick={() => openAdDestination(ad.clickThroughUrl, attr)}
        >
          Sponsored
        </button>
        {canSkip ? (
          <button
            type="button"
            onClick={complete}
            className="text-sm font-bold text-white bg-white/20 px-4 py-1.5 rounded-full"
          >
            Skip Ad
          </button>
        ) : skipLabel ? (
          <span className="text-sm text-white/70">{skipLabel}</span>
        ) : null}
      </div>
      <div className={mediaWrapClass}>
        <AdMediaDisplay
          mediaUrl={ad.mediaUrl}
          mediaType={ad.mediaType}
          alt={ad.title}
          className="w-full h-full object-contain bg-black"
          onReady={() => setMediaReady(true)}
          onError={complete}
          onEnded={schedulePostEndSkip}
          onTimeUpdate={(currentTime, duration) => {
            setAdCurrentTime(currentTime)
            if (Number.isFinite(duration) && duration > 0) {
              setAdDuration(duration)
            }
          }}
        />
      </div>
    </div>
  )
}
