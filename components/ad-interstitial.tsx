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
import { AdSkipButton, AdSkipCountdown } from "@/components/ad-skip-button"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"
import { useAuth } from "@/contexts/auth-context"

interface AdInterstitialProps {
  onClose: () => void
  creatorId?: string
  videoId?: string
  servedAd?: ServedAd
}

export function AdInterstitial({
  onClose,
  creatorId,
  videoId,
  servedAd,
}: AdInterstitialProps) {
  const showAds = useShouldShowAds()
  const { user } = useAuth()
  const { isPlacementEnabled, platformCreatorId } = usePublicAdsConfig()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const finishedRef = useRef(false)

  const close = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onCloseRef.current()
  }, [])

  const [ad, setAd] = useState<ServedAd | null | undefined>(
    servedAd !== undefined
      ? isValidServedAd(servedAd)
        ? servedAd
        : null
      : undefined,
  )
  const [mediaReady, setMediaReady] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const placementEnabled = isPlacementEnabled("shorts_interstitial")

  useEffect(() => {
    finishedRef.current = false
    setMediaReady(false)
  }, [servedAd?.id])

  useEffect(() => {
    if (servedAd !== undefined) {
      const valid = isValidServedAd(servedAd) ? servedAd : null
      setAd(valid)
      if (valid) setCountdown(valid.skipAfterSeconds || 5)
      if (!valid) close()
      return
    }

    if (!showAds || !placementEnabled) {
      setAd(null)
      close()
      return
    }

    void fetchServedAd("shorts_interstitial").then((served) => {
      const valid = isValidServedAd(served) ? served : null
      setAd(valid)
      if (valid) setCountdown(valid.skipAfterSeconds || 5)
      if (!valid) close()
    })
  }, [showAds, placementEnabled, servedAd, close])

  useEffect(() => {
    if (!ad) return
    const attr = buildAdAttribution({
      campaignId: ad.id,
      placement: "shorts_interstitial",
      creatorId,
      platformCreatorId,
      videoId,
      viewerUserId: user?.id,
    })
    void trackAdImpression(attr)
  }, [ad, creatorId, platformCreatorId, videoId, user?.id])

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
    placement: "shorts_interstitial",
    creatorId,
    platformCreatorId,
    videoId,
    viewerUserId: user?.id,
  })

  const onMediaReady = () => {
    setMediaReady(true)
    setCountdown(ad.skipAfterSeconds || 5)
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <a
          href={ad.clickThroughUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault()
            openAdDestination(ad.clickThroughUrl, attr)
          }}
          className="text-xs text-white/70 hover:text-white underline truncate max-w-[70%]"
        >
          Sponsored · {ad.title}
        </a>
        {mediaReady && countdown <= 0 ? (
          <AdSkipButton onClick={close}>Close</AdSkipButton>
        ) : mediaReady ? (
          <AdSkipCountdown>Close in {countdown}s</AdSkipCountdown>
        ) : (
          <AdSkipCountdown className="text-white/80">Loading…</AdSkipCountdown>
        )}
      </div>
      <AdMediaDisplay
        mediaUrl={ad.mediaUrl}
        mediaType={ad.mediaType}
        className="flex-1 w-full object-cover"
        onReady={onMediaReady}
        onError={() => close()}
      />
    </div>
  )
}
