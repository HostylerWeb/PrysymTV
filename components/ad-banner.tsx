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

type AdBannerProps = {
  creatorId?: string
  videoId?: string
  platformCreatorId?: string
}

export function AdBanner({ creatorId, videoId, platformCreatorId: platformCreatorIdProp }: AdBannerProps) {
  const showAds = useShouldShowAds()
  const { user } = useAuth()
  const { isPlacementEnabled, platformCreatorId: platformCreatorIdFromConfig } =
    usePublicAdsConfig()
  const platformCreatorId = platformCreatorIdProp ?? platformCreatorIdFromConfig
  const [ad, setAd] = useState<ServedAd | null>(null)

  const placementEnabled = isPlacementEnabled("home_banner")

  useEffect(() => {
    if (!showAds || !placementEnabled) {
      setAd(null)
      return
    }
    let cancelled = false
    void fetchServedAd("home_banner").then((served) => {
      if (!cancelled) setAd(served)
    })
    return () => {
      cancelled = true
    }
  }, [showAds, placementEnabled])

  useEffect(() => {
    if (!ad) return
    const attr = buildAdAttribution({
      campaignId: ad.id,
      placement: "home_banner",
      creatorId,
      platformCreatorId,
      videoId,
      viewerUserId: user?.id,
    })
    void trackAdImpression(attr)
  }, [ad, creatorId, platformCreatorId, videoId, user?.id])

  if (!placementEnabled || !ad) return null

  const attr = buildAdAttribution({
    campaignId: ad.id,
    placement: "home_banner",
    creatorId,
    platformCreatorId,
    videoId,
    viewerUserId: user?.id,
  })

  return (
    <section className="px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sponsored</p>
        <Link
          href={ad.clickThroughUrl}
          onClick={() => {
            void trackAdClick(attr)
          }}
          className="block relative w-full aspect-[6/1] md:aspect-[8/1] rounded-xl overflow-hidden border border-border hover:opacity-95 transition-opacity"
        >
          {ad.mediaType === "video" ? (
            <video src={ad.mediaUrl} className="w-full h-full object-cover" muted autoPlay playsInline />
          ) : (
            <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
          )}
        </Link>
      </div>
    </section>
  )
}
