"use client"

import { useCallback, useEffect, useState } from "react"
import { Cast, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  castMedia,
  getCastState,
  loadCastSdk,
  subscribeCastState,
  type CastableMedia,
} from "@/lib/chromecast"
import { notify } from "@/lib/site-notifications"

type CastMediaButtonProps = {
  className?: string
  /** Use on dark video overlays */
  variant?: "default" | "on-video" | "compact"
  label?: string
  media?: CastableMedia | null
  /** Read playback position when the user taps cast (e.g. from a video element). */
  getCurrentTime?: () => number
  onCastStarted?: () => void
}

export function CastMediaButton({
  className,
  variant = "default",
  label = "Cast to TV",
  media,
  getCurrentTime,
  onCastStarted,
}: CastMediaButtonProps) {
  const [castState, setCastState] = useState<cast.framework.CastState | "unavailable">(
    "unavailable",
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCast = Boolean(media?.streamUrl?.trim())

  useEffect(() => {
    if (!canCast) return
    let cancelled = false
    let unsubscribe = () => {}

    void loadCastSdk()
      .then(() => {
        if (cancelled) return
        setCastState(getCastState())
        unsubscribe = subscribeCastState((state) => {
          if (!cancelled) setCastState(state)
        })
      })
      .catch(() => {
        if (!cancelled) setCastState("unavailable")
      })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [canCast])

  const handleClick = useCallback(async () => {
    if (!media?.streamUrl?.trim()) return
    setError(null)
    setBusy(true)
    try {
      await castMedia({
        ...media,
        currentTime: getCurrentTime?.() ?? media.currentTime,
      })
      onCastStarted?.()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not cast to your TV"
      setError(message)
      notify.error(message, {
        description: /connect|timeout|cancelled|session|unavailable|wi-?fi|network/i.test(
          message,
        )
          ? "Make sure your TV or Chromecast is on and connected to the same Wi‑Fi network."
          : /could not load|cast error|format/i.test(message)
            ? "If this keeps happening, try another video or a real Chromecast instead of a receiver app."
            : undefined,
      })
    } finally {
      setBusy(false)
    }
  }, [media, getCurrentTime, onCastStarted])

  if (!canCast) return null

  const isConnected = castState === "connected"
  const title = error ?? (isConnected ? `${label} (connected)` : label)

  return (
    <button
      type="button"
      disabled={busy}
      className={cn(
        "rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-60",
        variant === "on-video" &&
          "w-10 h-10 bg-background/20 hover:bg-background/30 text-white",
        isConnected && variant === "on-video" && "bg-primary/80 text-primary-foreground",
        variant === "compact" &&
          "w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary",
        isConnected && variant === "compact" && "text-primary bg-primary/10",
        variant === "default" &&
          "w-10 h-10 hover:bg-secondary text-foreground",
        isConnected && variant === "default" && "bg-primary/15 text-primary",
        className,
      )}
      title={title}
      aria-label={label}
      onClick={() => void handleClick()}
    >
      {busy ? (
        <Loader2
          className={cn(
            "animate-spin",
            variant === "compact" ? "w-4 h-4" : "w-5 h-5",
          )}
        />
      ) : (
        <Cast className={cn(variant === "compact" ? "w-4 h-4" : "w-5 h-5")} />
      )}
    </button>
  )
}
