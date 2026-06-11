"use client"

import { useEffect, useState } from "react"
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

type VerticalEpisodeAdGateProps = {
  seriesId?: string
  creatorId?: string
  onComplete: () => void
}

/** Full-screen ad before the next vertical-film episode plays. */
export function VerticalEpisodeAdGate({
  seriesId,
  creatorId,
  onComplete,
}: VerticalEpisodeAdGateProps) {
  const showAds = useShouldShowAds()
  const { user } = useAuth()
  const { isPlacementEnabled, platformCreatorId } = usePublicAdsConfig()
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined)
  const [countdown, setCountdown] = useState(5)

  const placementEnabled = isPlacementEnabled("vertical_episode")

  useEffect(() => {
    if (!showAds || !placementEnabled) {
      onComplete()
      return
    }
    void fetchServedAd("vertical_episode").then((served) => {
      setAd(served)
      if (served) setCountdown(served.skipAfterSeconds || 5)
      else onComplete()
    })
  }, [onComplete, showAds, placementEnabled])

  useEffect(() => {
    if (!ad) return
    const attr = buildAdAttribution({
      campaignId: ad.id,
      placement: "vertical_episode",
      creatorId,
      platformCreatorId,
      videoId: seriesId,
      viewerUserId: user?.id,
    })
    void trackAdImpression(attr)
  }, [ad, creatorId, platformCreatorId, seriesId, user?.id])

  useEffect(() => {
    if (!ad) return
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, ad])

  if (ad === undefined) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <p className="text-white/70 text-sm">Loading sponsor…</p>
      </div>
    )
  }

  if (!ad) return null

  const attr = buildAdAttribution({
    campaignId: ad.id,
    placement: "vertical_episode",
    creatorId,
    platformCreatorId,
    videoId: seriesId,
    viewerUserId: user?.id,
  })

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-lg mx-auto">
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
            onClick={onComplete}
            className="text-sm font-bold text-white bg-white/20 px-4 py-1.5 rounded-full"
          >
            Continue
          </button>
        ) : (
          <span className="text-sm text-white/70">Continue in {countdown}s</span>
        )}
      </div>
      {ad.mediaType === "video" ? (
        <video src={ad.mediaUrl} autoPlay muted playsInline className="flex-1 w-full object-cover" />
      ) : (
        <img src={ad.mediaUrl} alt="" className="flex-1 w-full object-cover" />
      )}
    </div>
  )
}
