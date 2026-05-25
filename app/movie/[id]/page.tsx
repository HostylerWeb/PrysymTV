"use client"

import { useState, useRef } from "react"
import { 
  ChevronLeft, 
  Play, 
  Plus, 
  Check,
  Share2, 
  Star,
  Clock,
  Calendar,
  ThumbsUp,
  Lock,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/contexts/auth-context"
import { Footer } from "@/components/footer"

const movieData = {
  title: "The Last Frontier",
  tagline: "A Journey Beyond Imagination",
  banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=800&fit=crop",
  poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
  year: "2024",
  rating: "9.2",
  duration: "2h 34m",
  ageRating: "PG-13",
  genres: ["Sci-Fi", "Adventure", "Drama"],
  description: "An epic journey through uncharted territories where courage meets destiny. Follow the remarkable story of explorers facing the unknown in this breathtaking cinematic experience that redefines the boundaries of imagination and human spirit.",
  longDescription: "In the year 2157, humanity has expanded across the solar system. When a mysterious signal is detected from beyond Neptune, a crew of brave explorers embarks on a perilous journey to make first contact. Led by Captain Elena Rodriguez, the team must navigate treacherous space anomalies, internal conflicts, and the ultimate question: Are we alone in the universe? As they venture deeper into the unknown, they discover that the frontier holds secrets that will change everything they know about existence itself.",
  director: "James Anderson",
  writers: ["Sarah Mitchell", "David Chen"],
  matchScore: "98%",
  views: "45.2M"
}

const cast = [
  { name: "Emma Stone", role: "Captain Elena Rodriguez", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
  { name: "Michael B. Jordan", role: "Dr. Marcus Webb", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
  { name: "Scarlett Johansson", role: "Commander Sarah Chen", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" },
  { name: "Oscar Isaac", role: "Chief Engineer Torres", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop" },
  { name: "Zendaya", role: "Lt. Maya Parker", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop" },
]

export default function MovieDetailPage() {
  const { isAuthenticated } = useAuth()
  const [isInList, setIsInList] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [activeTab, setActiveTab] = useState("movies")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  // Video Player State
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleWatchNow = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsPlaying(true)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    }, 100)
  }

  const handleAddToList = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsInList(!isInList)
  }

  const handleLike = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    // Handle like
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Player / Hero Banner */}
        <div className="relative w-full aspect-video md:aspect-[21/9] bg-black overflow-hidden shadow-2xl group transition-all duration-500">
          {isPlaying ? (
            <>
              <video 
                ref={videoRef}
                src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
              <button 
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </>
          ) : (
            <>
              <img
                src={movieData.banner}
                alt={movieData.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent md:via-background/60" />
              
              {/* Top Navigation */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <Link href="/movies">
                  <button className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center hover:bg-background/50 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                </Link>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-md flex items-center justify-center hover:bg-background/50 transition-colors">
                    <Share2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Play button center (Mobile only) */}
              <button 
                onClick={handleWatchNow}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform md:hidden z-10 shadow-xl"
              >
                {isAuthenticated ? (
                  <Play className="w-10 h-10 text-primary-foreground fill-primary-foreground ml-1" />
                ) : (
                  <Lock className="w-8 h-8 text-primary-foreground" />
                )}
              </button>
              
              {/* Hero Content (PC only) */}
              <div className="hidden md:flex absolute bottom-0 left-0 w-full p-8 flex-col justify-end z-10">
                <div className="max-w-2xl">
                  <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 inline-block">{movieData.matchScore} Match</span>
                  <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">{movieData.title}</h1>
                  <p className="text-lg text-white/80 italic mb-4 drop-shadow-md">{movieData.tagline}</p>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      size="lg"
                      onClick={handleWatchNow}
                      className="rounded-full gap-2 px-8 text-lg font-bold shadow-xl"
                    >
                      {isAuthenticated ? (
                        <>
                          <Play className="w-6 h-6 fill-current" />
                          Watch Now
                        </>
                      ) : (
                        <>
                          <Lock className="w-6 h-6" />
                          Sign in to Watch
                        </>
                      )}
                    </Button>
                    <button 
                      onClick={handleAddToList}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/20 hover:bg-white/20",
                        isInList ? "bg-primary text-white border-transparent" : "bg-black/40 text-white"
                      )}
                    >
                      {isInList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content Grid */}
        <div className="px-4 md:px-8 -mt-16 md:mt-8 relative z-10 grid md:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="md:col-span-2 flex flex-col">
            
            {/* Mobile Title (Hidden on PC) */}
            <div className="mb-4 md:hidden">
              <span className="text-primary text-sm font-semibold">{movieData.matchScore} Match</span>
              <h1 className="text-2xl font-bold text-foreground mt-1">{movieData.title}</h1>
              <p className="text-sm text-muted-foreground italic">{movieData.tagline}</p>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
              <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-foreground">{movieData.rating}</span>
              </div>
              <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{movieData.year}</span>
              </div>
              <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{movieData.duration}</span>
              </div>
              <span className="px-2 py-1 rounded-full bg-secondary text-sm font-medium text-foreground border border-border">
                {movieData.ageRating}
              </span>
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                4K Ultra HD
              </span>
            </div>

            {/* Mobile Action Buttons (Hidden on PC) */}
            <div className="flex items-center gap-3 mb-6 md:hidden">
              <Button 
                onClick={handleWatchNow}
                className="flex-1 rounded-full gap-2 h-12 text-base shadow-lg"
              >
                {isAuthenticated ? (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Watch Now
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Sign in to Watch
                  </>
                )}
              </Button>
              <button 
                onClick={handleAddToList}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                  isInList ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}
              >
                {isInList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </button>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movieData.genres.map((genre) => (
                <span 
                  key={genre}
                  className="px-3 py-1 rounded-full bg-secondary/50 text-foreground text-sm font-medium border border-border"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Login prompt for guests */}
            {!isAuthenticated && (
              <div className="mb-6 p-4 md:p-6 rounded-xl bg-secondary/30 border border-border flex flex-col md:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-base font-bold text-foreground">Sign in to watch {movieData.title}</p>
                  <p className="text-sm text-muted-foreground">Create a free account to start streaming instantly in 4K.</p>
                </div>
                <Button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="rounded-full w-full md:w-auto px-8"
                >
                  Sign In
                </Button>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-foreground mb-2 hidden md:block">Synopsis</h3>
              <p className={cn(
                "text-sm md:text-base text-foreground/80 leading-relaxed",
                !showFullDescription && "line-clamp-3 md:line-clamp-none"
              )}>
                {showFullDescription ? movieData.longDescription : movieData.description}
                {/* On PC always show full description, handled by line-clamp-none above */}
                <span className="hidden md:inline"> {movieData.longDescription.replace(movieData.description, '')}</span>
              </p>
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-sm font-medium text-primary mt-2 md:hidden"
              >
                {showFullDescription ? "Show Less" : "Read More"}
              </button>
            </div>

            {/* Cast Grid */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Top Cast</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {cast.map((member) => (
                  <div key={member.name} className="text-center group">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover mx-auto mb-2 ring-2 ring-transparent group-hover:ring-primary transition-all duration-300"
                    />
                    <p className="text-xs md:text-sm font-medium text-foreground line-clamp-1">{member.name}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-1">
            
            {/* Stats Panel (PC Only) */}
            <div className="hidden md:grid grid-cols-2 gap-4 mb-8 p-6 rounded-2xl bg-secondary/20 border border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Director</p>
                <p className="text-sm font-medium text-foreground">{movieData.director}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Writers</p>
                <p className="text-sm font-medium text-foreground line-clamp-2">{movieData.writers.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Views</p>
                <p className="text-sm font-medium text-foreground">{movieData.views}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Global Rank</p>
                <p className="text-sm font-medium text-primary">#3 Today</p>
              </div>
            </div>


          </div>
        </div>
      </div>

      <Footer />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  )
}
