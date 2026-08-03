"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  buildAdAttribution,
  fetchServedAd,
  isValidServedAd,
  openAdDestination,
  trackAdImpression,
  type ServedAd,
} from "@/lib/api/ads"
import { AdMediaDisplay } from "@/components/ad-media-display"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"
import { useAuth } from "@/contexts/auth-context"

const POST_END_SKIP_MS = 3000

type VerticalEpisodeAdGateProps = {
  creatorId?: string
  /** When provided, skips the serve request (parent already peeked). */
  servedAd?: ServedAd
  onComplete: () => void
}

/** Full-screen ad before the next vertical-film episode plays. */
export function VerticalEpisodeAdGate({
  creatorId,
  servedAd,
  onComplete,
}: VerticalEpisodeAdGateProps) {
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
  const [countdown, setCountdown] = useState(5)

  const placementEnabled = isPlacementEnabled("vertical_episode")

  useEffect(() => {
    finishedRef.current = false
    setMediaReady(false)
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
      if (valid) setCountdown(valid.skipAfterSeconds || 5)
      if (!valid) complete()
      return
    }

    if (!showAds || !placementEnabled) {
      setAd(null)
      complete()
      return
    }

    void fetchServedAd("vertical_episode").then((served) => {
      const valid = isValidServedAd(served) ? served : null
      setAd(valid)
      if (valid) setCountdown(valid.skipAfterSeconds || 5)
      if (!valid) complete()
    })
  }, [showAds, placementEnabled, servedAd, complete])

  useEffect(() => {
    if (!ad) return
    const attr = buildAdAttribution({
      campaignId: ad.id,
      placement: "vertical_episode",
      creatorId,
      platformCreatorId,
      viewerUserId: user?.id,
    })
    void trackAdImpression(attr)
  }, [ad, creatorId, platformCreatorId, user?.id])

  useEffect(() => {
    if (!ad || !mediaReady) return
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, ad, mediaReady])

  if (ad === undefined) return null
  if (!ad) return null

  const attr = buildAdAttribution({
    campaignId: ad.id,
    placement: "vertical_episode",
    creatorId,
    platformCreatorId,
    viewerUserId: user?.id,
  })

  const onMediaReady = () => {
    setMediaReady(true)
    setCountdown(ad.skipAfterSeconds || 5)
  }

  const canSkip = mediaReady && countdown <= 0

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <a
          href={ad.clickThroughUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault()
            openAdDestination(ad.clickThroughUrl, attr)
          }}
          className="text-xs text-white/70 hover:text-white underline shrink-0"
        >
          Sponsored
        </a>
        {canSkip ? (
          <button
            type="button"
            onClick={complete}
            className="text-sm font-bold text-white bg-white/20 px-4 py-1.5 rounded-full"
          >
            Skip Ad
          </button>
        ) : mediaReady ? (
          <span className="text-sm text-white/70">Skip in {countdown}s</span>
        ) : (
          <span className="text-sm text-white/50">Loading…</span>
        )}
      </div>
      <AdMediaDisplay
        mediaUrl={ad.mediaUrl}
        mediaType={ad.mediaType}
        className="flex-1 w-full object-cover"
        onReady={onMediaReady}
        onError={() => complete()}
        onEnded={schedulePostEndSkip}
      />
    </div>
  )
}
