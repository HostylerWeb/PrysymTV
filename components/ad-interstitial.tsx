"use client"

import { useState, useEffect } from "react"
import {
  fetchServedAd,
  trackAdImpression,
  type ServedAd,
} from "@/lib/api/ads"
import { useShouldShowAds } from "@/lib/hooks/use-should-show-ads"

interface AdInterstitialProps {
  onClose: () => void
  creatorId?: string
  videoId?: string
}

export function AdInterstitial({ onClose, creatorId, videoId }: AdInterstitialProps) {
  const showAds = useShouldShowAds()
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!showAds) {
      onClose()
      return
    }
    void fetchServedAd("shorts_interstitial").then((served) => {
      setAd(served)
      if (served) setCountdown(served.skipAfterSeconds || 5)
      else onClose()
    })
  }, [onClose, showAds])

  useEffect(() => {
    if (!ad || !creatorId) return
    void trackAdImpression({
      campaignId: ad.id,
      placement: "shorts_interstitial",
      creatorId,
      videoId,
    })
  }, [ad, creatorId, videoId])

  useEffect(() => {
    if (!ad) return
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, ad])

  if (ad === undefined) return null
  if (!ad) return null

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-white/70">Sponsored · {ad.title}</span>
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
