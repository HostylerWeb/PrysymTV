"use client"

import { useEffect, useState } from "react"
import {
  fetchServedAd,
  trackAdImpression,
  type ServedAd,
} from "@/lib/api/ads"

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
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    void fetchServedAd("vertical_episode").then((served) => {
      setAd(served)
      if (served) setCountdown(served.skipAfterSeconds || 5)
      else onComplete()
    })
  }, [onComplete])

  useEffect(() => {
    if (!ad || !creatorId) return
    void trackAdImpression({
      campaignId: ad.id,
      placement: "vertical_episode",
      creatorId,
      videoId: seriesId,
    })
  }, [ad, creatorId, seriesId])

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

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-white/70">Sponsored · {ad.title}</span>
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
