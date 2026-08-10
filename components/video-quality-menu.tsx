"use client"

import { useEffect, useState } from "react"
import { Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { HlsQualityControl } from "@/lib/hls-quality"

type VideoQualityMenuProps = {
  control: HlsQualityControl | null
  className?: string
  /** Compact icon for legacy bars; on-video matches the mobile pill button. */
  variant?: "compact" | "overlay" | "on-video"
  /** Modal avoids popover lag inside fullscreen / transformed containers. */
  presentation?: "popover" | "modal"
}

function QualityOptions({
  control,
  pendingLevel,
  onSelect,
}: {
  control: HlsQualityControl
  pendingLevel: number | null
  onSelect: (levelIndex: number) => void
}) {
  const singleLevel = control.levels.length === 1 ? control.levels[0] : null
  const activeLevel = pendingLevel ?? control.currentLevel

  return (
    <>
      {!singleLevel ? (
        <button
          type="button"
          onClick={() => onSelect(-1)}
          className={cn(
            "w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
            activeLevel < 0 && "bg-accent font-medium",
          )}
        >
          Auto
        </button>
      ) : null}
      {control.levels.map((level) => (
        <button
          key={level.index}
          type="button"
          onClick={() => onSelect(level.index)}
          className={cn(
            "w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
            activeLevel === level.index && "bg-accent font-medium",
          )}
        >
          {level.label}
        </button>
      ))}
    </>
  )
}

export function VideoQualityMenu({
  control,
  className,
  variant = "compact",
  presentation = "popover",
}: VideoQualityMenuProps) {
  const [open, setOpen] = useState(false)
  const [pendingLevel, setPendingLevel] = useState<number | null>(null)

  useEffect(() => {
    if (pendingLevel == null || !control) return
    if (control.currentLevel === pendingLevel) {
      setPendingLevel(null)
    }
  }, [control?.currentLevel, pendingLevel, control])

  if (!control || control.levels.length === 0) return null

  const activeLevel = pendingLevel ?? control.currentLevel
  const activeLabel =
    activeLevel < 0
      ? "Auto"
      : (control.levels.find((l) => l.index === activeLevel)?.label ?? "Auto")

  const handleSelect = (levelIndex: number) => {
    setPendingLevel(levelIndex)
    control.setLevel(levelIndex)
    setOpen(false)
  }

  const triggerClass = cn(
    "inline-flex items-center gap-1.5 rounded-full transition-colors shrink-0",
    variant === "overlay" &&
      "bg-black/60 text-white text-xs font-medium px-2.5 py-1.5 hover:bg-black/75",
    variant === "on-video" &&
      "bg-black/55 text-white text-xs font-semibold px-2.5 py-1.5 hover:bg-black/70 backdrop-blur-sm",
    variant === "compact" &&
      "h-9 justify-center text-white hover:text-white/80 px-1.5",
    className,
  )

  const trigger = (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className={triggerClass}
      aria-label={`Video quality: ${activeLabel}`}
    >
      <Settings2 className={cn(variant === "overlay" || variant === "on-video" ? "w-3.5 h-3.5" : "w-4 h-4")} />
      <span className="text-[11px] font-semibold tabular-nums">{activeLabel}</span>
    </button>
  )

  if (presentation === "modal") {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(true)
          }}
          className={triggerClass}
          aria-label={`Video quality: ${activeLabel}`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold tabular-nums">{activeLabel}</span>
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>Quality</DialogTitle>
            </DialogHeader>
            <div className="space-y-0.5">
              <QualityOptions
                control={control}
                pendingLevel={pendingLevel}
                onSelect={handleSelect}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-44 p-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Quality
        </p>
        <QualityOptions
          control={control}
          pendingLevel={pendingLevel}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
