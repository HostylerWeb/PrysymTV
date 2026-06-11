"use client"

import { useState, useEffect } from "react"
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

interface AdInterstitialProps {
  onClose: () => void
  creatorId?: string
  videoId?: string
}

export function AdInterstitial({ onClose, creatorId, videoId }: AdInterstitialProps) {
  const showAds = useShouldShowAds()
  const { user } = useAuth()
  const { isPlacementEnabled, platformCreatorId } = usePublicAdsConfig()
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined)
  const [countdown, setCountdown] = useState(5)

  const placementEnabled = isPlacementEnabled("shorts_interstitial")

  useEffect(() => {
    if (!showAds || !placementEnabled) {
      onClose()
      return
    }
    void fetchServedAd("shorts_interstitial").then((served) => {
      setAd(served)
      if (served) setCountdown(served.skipAfterSeconds || 5)
      else onClose()
    })
  }, [onClose, showAds, placementEnabled])

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
    if (!ad) return
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, ad])

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

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={ad.clickThroughUrl}
          onClick={() => void trackAdClick(attr)}
          className="text-xs text-white/70 hover:text-white underline truncate max-w-[70%]"
        >
          Sponsored · {ad.title}
        </Link>
        {countdown <= 0 ? (
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-white bg-white/20 px-4 py-1.5 rounded-full"
          >
            Skip
          </button>
        ) : (
          <span className="text-sm text-white/70">Skip in {countdown}s</span>
        )}
      </div>
      <video src={ad.mediaUrl} autoPlay muted playsInline className="flex-1 w-full object-cover" />
    </div>
  )
}
