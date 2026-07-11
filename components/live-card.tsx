"use client"

import { Coins, Users } from "lucide-react"
import Link from "next/link"
import { userAvatarUrl } from "@/lib/user-avatar"
import { LiveStreamThumbnail } from "@/components/live-stream-thumbnail"

interface LiveCardProps {
  id: string
  slug?: string
  title: string
  thumbnail?: string
  hlsPlaybackUrl?: string | null
  streamer: string
  streamerSlug?: string
  viewers: string
  category: string
  avatar?: string | null
  isPaid?: boolean
  entryCoinCost?: number | null
}

export function LiveCard({
  id,
  slug,
  title,
  thumbnail,
  hlsPlaybackUrl,
  streamer,
  streamerSlug,
  viewers,
  category,
  avatar,
  isPaid,
  entryCoinCost,
}: LiveCardProps) {
  return (
    <Link href={`/live/${id}`}>
      <div className="group flex-shrink-0 w-[300px] md:w-[340px] cursor-pointer">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
          <LiveStreamThumbnail
            title={title}
            hlsPlaybackUrl={hlsPlaybackUrl}
            thumbnailUrl={thumbnail}
            streamerAvatar={avatar}
            streamerSlug={streamerSlug ?? slug ?? streamer}
            streamer={streamer}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          <div className="absolute top-2 left-2 flex items-center gap-2 flex-wrap">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              LIVE
            </span>
            {isPaid ? (
              <span className="bg-amber-500/95 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <Coins className="w-3 h-3" />
                VIP · {entryCoinCost?.toLocaleString() ?? "—"} coins
              </span>
            ) : null}
            <span className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
              <Users className="w-3 h-3" />
              {viewers}
            </span>
          </div>

          <div className="absolute bottom-2 left-2">
            <span className="bg-secondary/90 backdrop-blur-sm text-secondary-foreground text-xs font-medium px-2 py-1 rounded">
              {category}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden ring-2 ring-primary">
            <img
              src={userAvatarUrl(avatar, streamerSlug ?? slug ?? streamer)}
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
