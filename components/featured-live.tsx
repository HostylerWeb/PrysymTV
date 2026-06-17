"use client"

import { Play, Users, Volume2, VolumeX, Maximize, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"
import { formatViewCount } from "@/lib/format-media"
import { LiveStreamThumbnail } from "@/components/live-stream-thumbnail"
import { userAvatarUrl } from "@/lib/user-avatar"

export type FeaturedLiveStream = {
  id: string
  slug: string
  title: string
  thumbnailUrl: string | null
  hlsPlaybackUrl?: string | null
  streamer: string
  streamerAvatar?: string | null
  viewerCount: number
}

type FeaturedLiveProps = {
  stream?: FeaturedLiveStream | null
}

export function FeaturedLive({ stream }: FeaturedLiveProps) {
  const [isMuted, setIsMuted] = useState(true)

  if (!stream) return null

  return (
    <section className="relative w-full pt-4 md:pt-6 pb-8 px-4">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-4 bg-secondary/30 rounded-2xl overflow-hidden border border-border">
          <div className="relative w-full lg:w-[70%] aspect-video bg-black group">
            <LiveStreamThumbnail
              title={stream.title}
              hlsPlaybackUrl={stream.hlsPlaybackUrl}
              thumbnailUrl={stream.thumbnailUrl}
              streamerAvatar={stream.streamerAvatar}
              streamerSlug={stream.slug}
              streamer={stream.streamer}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse">
              <Radio className="w-3 h-3" />
              LIVE
            </div>
            <div className="absolute top-4 left-20 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatViewCount(stream.viewerCount)}
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[30%] p-4 lg:p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={userAvatarUrl(stream.streamerAvatar, stream.slug)}
                alt=""
                className="w-12 h-12 rounded-full border-2 border-primary object-cover"
              />
              <div>
                <h3 className="text-foreground font-bold text-lg leading-tight">{stream.streamer}</h3>
                <p className="text-primary text-sm font-medium line-clamp-1">{stream.title}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm flex-1 line-clamp-4">
              Join thousands watching live on Prysym TV.
            </p>
            <Link href={`/live/${stream.slug}`} className="mt-4">
              <Button className="w-full rounded-full gap-2">
                <Play className="w-4 h-4 fill-current" />
                Watch Live
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
