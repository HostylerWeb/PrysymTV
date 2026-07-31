"use client"

import { useEffect, useState } from "react"
import {
  buildAdAttribution,
  fetchServedAd,
  openAdDestination,
  trackAdImpression,
  type ServedAd,
} from "@/lib/api/ads"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { AdMediaDisplay } from "@/components/ad-media-display"
import { getHomeBannerSizeConfig } from "@/lib/ad-banner-size"
import { getViewerGeo } from "@/lib/viewer-geo"
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
    if (!showAds || !placementEnabled) return
    void getViewerGeo()
  }, [showAds, placementEnabled])

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

  const bannerSize = getHomeBannerSizeConfig(ad.bannerSize)

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
        <a
          href={ad.clickThroughUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault()
            openAdDestination(ad.clickThroughUrl, attr)
          }}
          className={`block relative w-full ${bannerSize.webAspectClass} rounded-xl overflow-hidden border border-border hover:opacity-95 transition-opacity cursor-pointer`}
        >
          <AdMediaDisplay
            mediaUrl={ad.mediaUrl}
            mediaType={ad.mediaType}
            alt={ad.title}
            className="w-full h-full object-cover"
            onReady={() => {}}
            onError={() => {}}
          />
        </a>
      </div>
    </section>
  )
}
