"use client"

import { Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { HlsQualityControl } from "@/lib/hls-quality"

type VideoQualityMenuProps = {
  control: HlsQualityControl | null
  className?: string
  /** Compact icon for control bars; on-video for top overlay chrome; overlay for floating on native controls */
  variant?: "compact" | "overlay" | "on-video"
}

export function VideoQualityMenu({
  control,
  className,
  variant = "compact",
}: VideoQualityMenuProps) {
  if (!control || control.levels.length <= 1) return null

  const activeLabel =
    control.currentLevel < 0
      ? "Auto"
      : (control.levels.find((l) => l.index === control.currentLevel)?.label ??
        "Auto")

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full transition-colors shrink-0",
            variant === "overlay" &&
              "bg-black/60 text-white text-xs font-medium px-2.5 py-1.5 hover:bg-black/75",
            variant === "on-video" &&
              "h-10 bg-background/20 text-white text-xs font-medium px-3 hover:bg-background/30",
            variant === "compact" && "text-white hover:text-white/80",
            className,
          )}
          aria-label={`Video quality: ${activeLabel}`}
        >
          <Settings2
            className={cn(
              variant === "overlay" ? "w-3.5 h-3.5" : "w-4 h-4",
            )}
          />
          {variant !== "compact" ? (
            <span>{activeLabel}</span>
          ) : (
            <span className="text-[11px] font-medium tabular-nums">{activeLabel}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-44 p-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Quality
        </p>
        <button
          type="button"
          onClick={() => control.setLevel(-1)}
          className={cn(
            "w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
            control.currentLevel < 0 && "bg-accent font-medium",
          )}
        >
          Auto
        </button>
        {control.levels.map((level) => (
          <button
            key={level.index}
            type="button"
            onClick={() => control.setLevel(level.index)}
            className={cn(
              "w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
              control.currentLevel === level.index && "bg-accent font-medium",
            )}
          >
            {level.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
