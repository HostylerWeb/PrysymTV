"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  fetchServedAd,
  trackAdClick,
  trackAdImpression,
  type AdAttribution,
  type ServedAd,
} from "@/lib/api/ads"

type AdBannerProps = {
  creatorId?: string
  videoId?: string
}

export function AdBanner({ creatorId, videoId }: AdBannerProps) {
  const [ad, setAd] = useState<ServedAd | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchServedAd("home_banner").then((served) => {
      if (!cancelled) setAd(served)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ad) return
    const attr: AdAttribution = {
      campaignId: ad.id,
      placement: "home_banner",
      creatorId,
      videoId,
    }
    if (creatorId) void trackAdImpression(attr)
  }, [ad, creatorId, videoId])

  if (!ad) return null

  const attr: AdAttribution = {
    campaignId: ad.id,
    placement: "home_banner",
    creatorId,
    videoId,
  }

  return (
    <section className="px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sponsored</p>
        <Link
          href={ad.clickThroughUrl}
          onClick={() => {
            if (creatorId) void trackAdClick(attr)
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
