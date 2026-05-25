"use client"

import { useState } from "react"
import { 
  ChevronLeft, 
  Share2, 
  MoreVertical,
  Grid3X3, 
  Play,
  Users,
  Video,
  Heart,
  Bell,
  BellOff,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"

// Mock creator data - same for all creators
const creatorData = {
  name: "StreamVerse Originals",
  username: "@streamverse",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=400&fit=crop",
  bio: "Official StreamVerse channel. Home to award-winning original content, exclusive movies, and groundbreaking documentaries. New content every week!",
  subscribers: "12.5M",
  totalViews: "2.3B",
  videosCount: "248",
  isVerified: true,
  joinDate: "Jan 2019",
  links: [
    { label: "Website", url: "#" },
    { label: "Twitter", url: "#" },
    { label: "Instagram", url: "#" },
  ]
}

const tabs = [
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "live", label: "Live" },
  { id: "podcasts", label: "Podcasts" },
  { id: "playlists", label: "Playlists" },
]

const featuredVideo = {
  id: "1",
  title: "The Last Frontier - Official Trailer | A Journey Beyond Imagination",
  thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
  views: "15.2M",
  duration: "3:24",
  uploadedAt: "2 days ago"
}

const creatorVideos = [
  { id: "1", title: "Behind the Scenes: The Last Frontier", thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=170&fit=crop", views: "2.3M", duration: "24:15", uploadedAt: "1 week ago" },
  { id: "2", title: "Making of Epic Soundtracks", thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=170&fit=crop", views: "1.8M", duration: "18:32", uploadedAt: "2 weeks ago" },
  { id: "3", title: "Director's Commentary Special", thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=170&fit=crop", views: "3.5M", duration: "45:10", uploadedAt: "3 weeks ago" },
  { id: "4", title: "Cast Interviews: Meet the Stars", thumbnail: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=170&fit=crop", views: "5.2M", duration: "28:45", uploadedAt: "1 month ago" },
  { id: "5", title: "Visual Effects Breakdown", thumbnail: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=300&h=170&fit=crop", views: "1.5M", duration: "22:10", uploadedAt: "1 month ago" },
  { id: "6", title: "World Premiere Highlights", thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=170&fit=crop", views: "4.1M", duration: "12:33", uploadedAt: "2 months ago" },
]

const shortsVideos = [
  { id: "1", thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=350&fit=crop", views: "5.2M" },
  { id: "2", thumbnail: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&h=350&fit=crop", views: "3.8M" },
  { id: "3", thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=350&fit=crop", views: "2.1M" },
  { id: "4", thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&h=350&fit=crop", views: "4.5M" },
]

const creatorPodcasts = [
  { id: "1", title: "The Making of The Last Frontier", duration: "1h 12m", plays: "450K", cover: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&h=200&fit=crop", uploadedAt: "3 weeks ago" },
  { id: "2", title: "Director's Cut: Scene Analysis", duration: "45m", plays: "320K", cover: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&h=200&fit=crop", uploadedAt: "1 month ago" },
  { id: "3", title: "VFX Secrets Revealed", duration: "58m", plays: "890K", cover: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=200&h=200&fit=crop", uploadedAt: "2 months ago" },
]

import { Footer } from "@/components/footer"

export default function CreatorProfilePage() {
  const [activeTab, setActiveTab] = useState("videos")
  const [navTab, setNavTab] = useState("home")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notificationsOn, setNotificationsOn] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        {/* Banner */}
        <div className="relative w-full h-32 md:h-64 md:mt-4 md:rounded-2xl overflow-hidden shadow-md">
          <img
            src={creatorData.banner}
            alt="Channel banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          {/* Top Navigation */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <Link href="/">
              <button className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center hover:bg-background/50 transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center hover:bg-background/50 transition-colors">
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center hover:bg-background/50 transition-colors">
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 md:px-8 -mt-10 md:-mt-16 relative z-10 flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-8">
          {/* Avatar */}
          <img
            src={creatorData.avatar}
            alt={creatorData.name}
            className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-background shadow-lg"
          />
          
          <div className="flex-1 md:pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-3xl font-bold text-foreground">{creatorData.name}</h1>
              {creatorData.isVerified && (
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <p className="text-sm md:text-base text-muted-foreground">{creatorData.username}</p>
            
            {/* Stats - PC view groups them tightly */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {creatorData.subscribers} subscribers
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                {creatorData.videosCount} videos
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 md:pb-2 w-full md:w-auto">
            <Button 
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={cn(
                "flex-1 md:w-32 rounded-full",
                isSubscribed && "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
            {isSubscribed && (
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full flex-shrink-0"
                onClick={() => setNotificationsOn(!notificationsOn)}
              >
                {notificationsOn ? (
                  <Bell className="w-5 h-5 fill-current" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Bio and Links */}
        <div className="px-4 md:px-8 mb-8 md:max-w-3xl">
          <p className="text-sm md:text-base text-foreground/80 mb-4">{creatorData.bio}</p>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {creatorData.links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                className="px-4 py-1.5 rounded-full bg-secondary text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
            <span className="text-sm text-muted-foreground whitespace-nowrap px-2">Joined {creatorData.joinDate}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border sticky top-0 md:top-4 bg-background z-20 px-4 md:px-8">
          <div className="flex items-center overflow-x-auto scrollbar-hide gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-4 text-sm md:text-base font-medium whitespace-nowrap border-b-2 transition-colors -mb-[1px]",
                  activeTab === tab.id 
                    ? "border-primary text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 md:px-8 py-6">
          {activeTab === "videos" && (
            <>
              {/* Featured Video (only on Videos tab) */}
              <div className="mb-8">
                <Link href="/watch">
                  <div className="relative aspect-video md:aspect-[21/9] rounded-xl overflow-hidden bg-muted cursor-pointer group shadow-lg">
                    <img
                      src={featuredVideo.thumbnail}
                      alt={featuredVideo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs md:text-sm font-bold px-3 py-1 rounded shadow-md">
                      FEATURED
                    </div>
                    <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-md text-foreground text-xs md:text-sm font-medium px-2 py-1 rounded">
                      {featuredVideo.duration}
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-lg md:text-3xl font-bold text-white line-clamp-2 mb-2">{featuredVideo.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <span>{featuredVideo.views} views</span>
                        <span>•</span>
                        <span>{featuredVideo.uploadedAt}</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-white fill-white ml-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-4">Latest Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {creatorVideos.map((video) => (
                  <Link key={video.id} href="/watch">
                    <div className="flex flex-col cursor-pointer group h-full">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted mb-3 shadow-md">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-1.5 py-0.5 rounded">
                          {video.duration}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">{video.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">{video.views} views • {video.uploadedAt}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {activeTab === "shorts" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {shortsVideos.map((short) => (
                <Link key={short.id} href="/shorts">
                  <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-muted cursor-pointer group shadow-md">
                    <img
                      src={short.thumbnail}
                      alt="Short"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-sm font-medium">
                      <Play className="w-4 h-4 fill-current" />
                      {short.views}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === "live" && (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center bg-secondary/20 rounded-2xl border border-border/50">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6 shadow-sm">
                <Video className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">No live streams right now</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-sm">
                This channel has no live streams at the moment. Enable notifications to be alerted when they go live.
              </p>
            </div>
          )}

          {activeTab === "podcasts" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground mb-4">Latest Podcasts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatorPodcasts.map((podcast) => (
                  <Link key={podcast.id} href="/podcasts">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors cursor-pointer group shadow-sm">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                        <img src={podcast.cover} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{podcast.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{podcast.plays} plays • {podcast.uploadedAt}</p>
                      </div>
                      <div className="flex items-center text-muted-foreground flex-shrink-0">
                        <span className="text-xs font-medium">{podcast.duration}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === "playlists" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { title: "The Last Frontier Collection", count: 12, thumb: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=170&fit=crop" },
                { title: "Behind the Scenes", count: 8, thumb: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=170&fit=crop" }
              ].map((playlist, idx) => (
                <Link key={idx} href="/watch">
                  <div className="cursor-pointer group h-full">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-3 shadow-md">
                      <img
                        src={playlist.thumb}
                        alt="Playlist"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                          <Grid3X3 className="w-6 h-6 text-white" />
                          <span className="text-sm font-semibold text-white">{playlist.count} videos</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{playlist.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">View full playlist</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={navTab} 
        onTabChange={setNavTab}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
