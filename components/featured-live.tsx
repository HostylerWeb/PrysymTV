import { Play, Users, Volume2, VolumeX, Maximize, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Link from "next/link"

export function FeaturedLive() {
  const [isMuted, setIsMuted] = useState(true)

  return (
    <section className="relative w-full pt-20 md:pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-4 bg-secondary/30 rounded-2xl overflow-hidden border border-border">
          {/* Main Player Area */}
          <div className="relative w-full lg:w-[70%] aspect-video bg-black group">
            <img 
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=675&fit=crop" 
              alt="Live Stream"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            
            {/* Live Badge */}
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse">
              <Radio className="w-3 h-3" />
              LIVE
            </div>
            
            {/* Viewer Count */}
            <div className="absolute top-4 left-20 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <Users className="w-3 h-3" />
              24.5K
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stream Info & Chat Preview Area */}
          <div className="w-full lg:w-[30%] p-4 lg:p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" 
                alt="Creator"
                className="w-12 h-12 rounded-full border-2 border-primary"
              />
              <div>
                <h3 className="text-foreground font-bold text-lg leading-tight">ProGamerX</h3>
                <p className="text-primary text-sm font-medium">Playing Cyber Hunter 2077</p>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 line-clamp-2">
              Day 100 of the Ultimate Challenge! No Hit Run
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full font-medium">English</span>
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full font-medium">Esports</span>
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full font-medium">Competitive</span>
            </div>

            <div className="mt-auto space-y-3">
              <Link href="/live/progamerx">
                <Button className="w-full rounded-xl gap-2 h-12 text-base font-bold">
                  <Play className="w-5 h-5 fill-current" />
                  Watch Stream
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">
                Join 24,500+ others watching now
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
