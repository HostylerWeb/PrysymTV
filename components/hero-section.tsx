"use client"

import { Play, Info, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function HeroSection() {
  const [isMuted, setIsMuted] = useState(true)

  return (
    <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%), 
                              url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop')`
          }}
        />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 pb-24 md:p-8 md:pb-32">
        <div className="max-w-7xl mx-auto w-full px-4">
          <div className="max-w-lg">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
              NEW
            </span>
            <span className="text-muted-foreground text-sm">Trending #1 Today</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 text-pretty">
            The Last Frontier
          </h1>

          {/* Description */}
          <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-2 md:line-clamp-3">
            An epic journey through uncharted territories where courage meets destiny. 
            Follow the remarkable story of explorers facing the unknown.
          </p>

          {/* Tags */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span>2024</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>2h 15m</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Action</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Adventure</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 gap-2">
              <Play className="w-5 h-5 fill-current" />
              Play
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 bg-secondary/80 backdrop-blur-sm">
              <Info className="w-5 h-5" />
              More Info
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Mute Button */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-28 right-4 md:bottom-32 md:right-8 w-10 h-10 rounded-full border border-muted-foreground/50 flex items-center justify-center bg-background/20 backdrop-blur-sm hover:bg-background/40 transition-colors"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-foreground" />
        ) : (
          <Volume2 className="w-5 h-5 text-foreground" />
        )}
      </button>
    </section>
  )
}
