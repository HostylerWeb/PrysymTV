"use client"

import { Cast } from "lucide-react"
import { cn } from "@/lib/utils"

type CastMediaButtonProps = {
  className?: string
  /** Use on dark video overlays */
  variant?: "default" | "on-video" | "compact"
  label?: string
}

/**
 * Cast the current media item to a TV (Chromecast / Google Cast).
 * Wire to the Cast SDK when ready — not the whole site chrome.
 */
export function CastMediaButton({
  className,
  variant = "default",
  label = "Cast to TV",
}: CastMediaButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full flex items-center justify-center transition-colors shrink-0",
        variant === "on-video" &&
          "w-10 h-10 bg-background/20 hover:bg-background/30 text-white",
        variant === "compact" &&
          "w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary",
        variant === "default" &&
          "w-10 h-10 hover:bg-secondary text-foreground",
        className,
      )}
      title={`${label} (coming soon)`}
      aria-label={label}
      onClick={() => {
        window.alert(
          "Cast will send the current video or audio to your TV. Full Chromecast support is coming soon.",
        )
      }}
    >
      <Cast className={cn(variant === "compact" ? "w-4 h-4" : "w-5 h-5")} />
    </button>
  )
}
