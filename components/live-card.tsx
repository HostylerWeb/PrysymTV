"use client"

import { Users } from "lucide-react"
import Link from "next/link"

interface LiveCardProps {
  id: string
  slug?: string
  title: string
  thumbnail: string
  streamer: string
  viewers: string
  category: string
  avatar?: string
}

export function LiveCard({ id, slug, title, thumbnail, streamer, viewers, category, avatar }: LiveCardProps) {
  return (
    <Link href={`/live/${slug ?? id}`}>
      <div className="group flex-shrink-0 w-[300px] md:w-[340px] cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Live Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              LIVE
            </span>
            <span className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
              <Users className="w-3 h-3" />
              {viewers}
            </span>
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-2 left-2">
            <span className="bg-secondary/90 backdrop-blur-sm text-secondary-foreground text-xs font-medium px-2 py-1 rounded">
              {category}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden ring-2 ring-primary">
            <img
              src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${streamer}`}
              alt={streamer}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{streamer}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
