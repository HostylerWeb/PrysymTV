"use client"

import { useEffect } from "react"
import { getAd } from "@/lib/mock-data"
import Link from "next/link"

export function AdBanner() {
  const ad = getAd("home_banner")
  if (!ad) return null

  useEffect(() => {
    // POST /ads/track/impression when backend is ready
  }, [])

  return (
    <section className="px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sponsored</p>
        <Link
          href={ad.clickThroughUrl}
          onClick={() => {
            /* POST /ads/track/click */
          }}
          className="block relative w-full aspect-[6/1] md:aspect-[8/1] rounded-xl overflow-hidden border border-border hover:opacity-95 transition-opacity"
        >
          <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
        </Link>
      </div>
    </section>
  )
}
