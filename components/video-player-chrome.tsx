"use client"

import { Maximize, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react"
import { VideoQualityMenu } from "@/components/video-quality-menu"
import { VideoScrubber, formatVideoTime } from "@/components/video-scrubber"
import type { HlsQualityControl } from "@/lib/hls-quality"
import { cn } from "@/lib/utils"

type VideoPlayerChromeProps = {
  currentTime: number
  duration: number
  playing: boolean
  muted: boolean
  qualityControl: HlsQualityControl | null
  isFullscreen?: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
  onSeek: (seconds: number) => void
  onToggleFullscreen?: () => void
  className?: string
}

/** Bottom player controls styled like the mobile app (time + scrubber + quality). */
export function VideoPlayerChrome({
  currentTime,
  duration,
  playing,
  muted,
  qualityControl,
  isFullscreen = false,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onToggleFullscreen,
  className,
}: VideoPlayerChromeProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-black/55 px-2.5 pb-2 pt-2.5 backdrop-blur-sm",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-1 flex items-center gap-2.5 text-white">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePlay()
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 fill-white" />
          )}
        </button>
        <span className="min-w-0 flex-1 truncate tabular-nums text-xs font-semibold text-white/90">
          {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <VideoQualityMenu
            control={qualityControl}
            variant="on-video"
            presentation={isFullscreen ? "modal" : "popover"}
          />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMute()
            }}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          {onToggleFullscreen ? (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFullscreen()
              }}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          ) : null}
        </div>
      </div>
      <VideoScrubber
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
      />
    </div>
  )
}
