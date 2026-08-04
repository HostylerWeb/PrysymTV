"use client"

import { useEffect } from "react"
import { subscribeLiveFeed } from "@/lib/api/live-feed-socket"

/** Refetch home/videos live rails when a stream goes live or ends. */
export function useLiveFeedUpdates(onUpdate: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    return subscribeLiveFeed(() => {
      onUpdate()
    })
  }, [enabled, onUpdate])
}
