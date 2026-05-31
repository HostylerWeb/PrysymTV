"use client"

import { useState, useEffect } from "react"
import { getAd } from "@/lib/mock-data"

interface AdInterstitialProps {
  onClose: () => void
}

export function AdInterstitial({ onClose }: AdInterstitialProps) {
  const ad = getAd("shorts_interstitial")
  const [countdown, setCountdown] = useState(ad?.skipAfterSeconds ?? 5)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  if (!ad) {
    onClose()
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-white/70">Sponsored</span>
        {countdown <= 0 ? (
          <button onClick={onClose} className="text-sm font-bold text-white bg-white/20 px-4 py-1.5 rounded-full">
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
