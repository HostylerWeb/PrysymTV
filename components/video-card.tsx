"use client"

import { Play } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { userAvatarUrl } from "@/lib/user-avatar"

interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  duration?: string
  views?: string
  channel?: string
  isLive?: boolean
  liveViewers?: string
  type: "movie" | "video" | "live"
  progress?: number
}

export function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  views,
  channel,
  isLive,
  liveViewers,
  type,
  progress,
}: VideoCardProps) {
  return (
    <Link href={type === "movie" ? `/movie/${id}` : isLive ? `/live/${id}` : `/watch/${id}`}>
      <div className="group flex-shrink-0 w-[280px] md:w-[320px] cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-foreground/90 flex items-center justify-center">
              <Play className="w-5 h-5 text-background fill-background ml-0.5" />
            </div>
          </div>

          {/* Duration / Live Badge */}
          <div className="absolute bottom-2 right-2">
            {isLive ? (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                LIVE
              </span>
            ) : duration ? (
              <span className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded">
                {duration}
              </span>
            ) : null}
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex gap-3">
          {type === "video" && (
            <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0 overflow-hidden">
              <img
                src={userAvatarUrl(null, channel)}
                alt={channel}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {channel && <span>{channel}</span>}
              {channel && views && <span>•</span>}
              {isLive && liveViewers ? (
                <span>{liveViewers} watching</span>
              ) : views ? (
                <span>{views} views</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
