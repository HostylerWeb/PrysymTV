"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

type VideoScrubberProps = {
  currentTime: number
  duration: number
  onSeek: (seconds: number) => void
  className?: string
}

/** Mobile-style seek bar with drag support and a large touch target. */
export function VideoScrubber({
  currentTime,
  duration,
  onSeek,
  className,
}: VideoScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)

  const displayTime = previewTime ?? currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track || !duration) return null
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return ratio * duration
    },
    [duration],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    const next = seekFromClientX(e.clientX)
    if (next == null) return
    setPreviewTime(next)
    onSeek(next)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    e.stopPropagation()
    const next = seekFromClientX(e.clientX)
    if (next == null) return
    setPreviewTime(next)
    onSeek(next)
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    e.stopPropagation()
    setDragging(false)
    setPreviewTime(null)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative w-full cursor-pointer touch-none py-3 -my-2 select-none",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={displayTime}
      aria-label="Seek"
    >
      <div className="h-1 rounded-full bg-white/35 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-primary",
            dragging ? "" : "transition-[width] duration-100",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
