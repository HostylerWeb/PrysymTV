"use client"

import { Heart, Play } from "lucide-react"
import Link from "next/link"
import { formatViewCount } from "@/lib/format-media"

interface MovieCardProps {
  id: string
  title: string
  poster: string
  year: string
  rating: number
  genre: string
}

export function MovieCard({ id, title, poster, year, rating, genre }: MovieCardProps) {
  return (
    <Link href={`/movie/${id}`}>
      <div className="group flex-shrink-0 w-[140px] md:w-[160px] cursor-pointer">
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-foreground/90 flex items-center justify-center">
              <Play className="w-5 h-5 text-background fill-background ml-0.5" />
            </div>
          </div>

          {rating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
            <Heart className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-medium text-foreground">{formatViewCount(rating)}</span>
          </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="text-sm font-medium text-foreground line-clamp-1 mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{year}</span>
            <span>•</span>
            <span>{genre}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
