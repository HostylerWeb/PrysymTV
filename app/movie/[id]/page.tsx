"use client"

import { use, useState, useRef } from "react"
import { ChevronLeft, Play, Plus, Check, Share2, Star, Clock, Calendar, Lock, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { AdPreroll } from "@/components/ad-preroll"
import { ReportModal } from "@/components/report-modal"
import { ShareSheet } from "@/components/share-sheet"
import { Footer } from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { getMovie } from "@/lib/mock-data"

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const movie = getMovie(id)
  const { isAuthenticated } = useAuth()
  const [isInList, setIsInList] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [activeTab, setActiveTab] = useState("movies")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPreroll, setShowPreroll] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleWatchNow = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setShowPreroll(true)
  }

  const startPlayback = () => {
    setShowPreroll(false)
    setIsPlaying(true)
    setTimeout(() => videoRef.current?.play(), 100)
  }

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) setIsAuthModalOpen(true)
    else action()
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="relative w-full aspect-video md:aspect-[21/9] bg-black overflow-hidden">
          {showPreroll && (
            <AdPreroll onComplete={startPlayback} videoId={movie.id} />
          )}
          {isPlaying ? (
            <>
              <video ref={videoRef} src={movie.videoUrl} controls autoPlay className="w-full h-full object-contain" />
              <button onClick={() => setIsPlaying(false)} className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white">✕</button>
            </>
          ) : (
            <>
              <img src={movie.banner} alt={movie.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                <Link href="/movies"><button className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center"><ChevronLeft className="w-6 h-6 text-white" /></button></Link>
                <div className="flex gap-2">
                  <button onClick={() => setIsShareOpen(true)} className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></button>
                  <button onClick={() => setIsReportOpen(true)} className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center"><Flag className="w-5 h-5 text-white" /></button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-8 hidden md:block">
                <span className="text-primary text-sm font-bold">{movie.matchScore} Match</span>
                <h1 className="text-4xl font-bold text-white mb-2">{movie.title}</h1>
                <p className="text-white/80 italic mb-4">{movie.tagline}</p>
                <Button size="lg" onClick={handleWatchNow} className="rounded-full gap-2">
                  {isAuthenticated ? <><Play className="w-6 h-6 fill-current" /> Watch Now</> : <><Lock className="w-6 h-6" /> Sign in to Watch</>}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="px-4 md:px-8 py-6 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="md:hidden mb-4">
              <h1 className="text-2xl font-bold">{movie.title}</h1>
              <p className="text-sm text-muted-foreground italic">{movie.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full text-sm"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{movie.rating}</span>
              <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-sm"><Calendar className="w-4 h-4" />{movie.year}</span>
              <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-sm"><Clock className="w-4 h-4" />{movie.duration}</span>
              <span className="px-2 py-1 rounded-full bg-secondary text-sm">{movie.ageRating}</span>
            </div>
            <div className="flex gap-3 mb-6 md:hidden">
              <Button onClick={handleWatchNow} className="flex-1 rounded-full gap-2">{isAuthenticated ? "Watch Now" : "Sign in"}</Button>
              <button onClick={() => requireAuth(() => setIsInList(!isInList))} className={cn("w-12 h-12 rounded-full flex items-center justify-center", isInList ? "bg-primary text-white" : "bg-secondary")}>
                {isInList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">{movie.genres.map((g) => <span key={g} className="px-3 py-1 rounded-full bg-secondary/50 text-sm">{g}</span>)}</div>
            <p className={cn("text-sm text-foreground/80", !showFullDescription && "line-clamp-3 md:line-clamp-none")}>{showFullDescription ? movie.longDescription : movie.description}</p>
            <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-sm text-primary mt-2 md:hidden">{showFullDescription ? "Show Less" : "Read More"}</button>
            {movie.cast.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4">Top Cast</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {movie.cast.map((m) => (
                    <div key={m.name} className="text-center">
                      <img src={m.image} alt={m.name} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                      <p className="text-xs font-medium">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:block p-6 rounded-2xl bg-secondary/20 border border-border h-fit">
            <p className="text-xs text-muted-foreground">Director</p>
            <p className="text-sm font-medium mb-3">{movie.director}</p>
            <p className="text-xs text-muted-foreground">Views</p>
            <p className="text-sm font-medium">{movie.views}</p>
          </div>
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} targetType="video" targetLabel={movie.title} />
      <ShareSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title={movie.title} />
    </main>
  )
}
