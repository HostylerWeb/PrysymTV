"use client"

import { useState, useEffect, Suspense } from "react"
import { 
  ChevronLeft, 
  Settings, 
  Edit3, 
  Grid3X3, 
  Bookmark, 
  Heart,
  Clock,
  Play,
  ChevronRight,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { CoinsModal } from "@/components/coins-modal"
import { AuthModal } from "@/components/auth-modal"
import { StreamerApplicationModal } from "@/components/streamer-application-modal"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { ProfileSettingsSheet, type ProfileSettingsScreen } from "@/components/profile-settings-sheet"
import { useAuth } from "@/contexts/auth-context"
import { useSearchParams } from "next/navigation"

const tabs = [
  { id: "videos", label: "Videos", icon: Grid3X3 },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
]

const userVideos = [
  { id: "1", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=300&fit=crop", views: "2.3M", duration: "24:15" },
  { id: "2", thumbnail: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&h=300&fit=crop", views: "1.8M", duration: "22:10" },
  { id: "3", thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=300&fit=crop", views: "5.2M", duration: "28:45" },
  { id: "4", thumbnail: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=300&h=300&fit=crop", views: "1.5M", duration: "12:33" },
  { id: "5", thumbnail: "https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=300&fit=crop", views: "3.1M", duration: "15:20" },
  { id: "6", thumbnail: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=300&h=300&fit=crop", views: "890K", duration: "18:42" },
]

const savedItems = [
  { id: "1", thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=300&fit=crop", title: "The Last Frontier", type: "Movie" },
  { id: "2", thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=300&fit=crop", title: "ProGamerX Live", type: "Live" },
  { id: "3", thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=300&fit=crop", title: "Interstellar", type: "Movie" },
  { id: "4", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop", title: "Home Workout", type: "Video" },
]

const watchHistory = [
  { id: "1", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=120&fit=crop", title: "The Art of Coffee Making", channel: "Brew Masters", progress: 75 },
  { id: "2", thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&h=120&fit=crop", title: "The Dark Knight Returns", channel: "Movie Hub", progress: 30 },
  { id: "3", thumbnail: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&h=120&fit=crop", title: "Breaking Bad - S5E12", channel: "TV Shows", progress: 80 },
]

const VALID_SETTINGS_SCREENS: ProfileSettingsScreen[] = [
  "menu",
  "notifications",
  "dashboard",
  "help",
  "premium",
  "history",
  "go-live",
  "upload",
]

function ProfilePageContent() {
  const searchParams = useSearchParams()
  const settingsParam = searchParams.get("settings")
  const initialSettingsScreen =
    settingsParam && VALID_SETTINGS_SCREENS.includes(settingsParam as ProfileSettingsScreen)
      ? (settingsParam as ProfileSettingsScreen)
      : undefined

  const { user, isAuthenticated, isLoading, logout, updateCoins } = useAuth()
  const [activeTab, setActiveTab] = useState("videos")
  const [showSettings, setShowSettings] = useState(false)
  const [settingsOpenTo, setSettingsOpenTo] = useState<ProfileSettingsScreen | undefined>()
  const [navTab, setNavTab] = useState("profile")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isStreamerModalOpen, setIsStreamerModalOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(true)

  const openSettingsPanel = (screen: ProfileSettingsScreen = "menu") => {
    setSettingsOpenTo(screen)
    setShowSettings(true)
  }

  const closeSettingsPanel = () => {
    setShowSettings(false)
    setSettingsOpenTo(undefined)
  }

  useEffect(() => {
    if (initialSettingsScreen && initialSettingsScreen !== "menu" && isAuthenticated && !isLoading) {
      openSettingsPanel(initialSettingsScreen)
    }
  }, [initialSettingsScreen, isAuthenticated, isLoading])

  const handlePurchaseCoins = (amount: number) => {
    updateCoins(amount)
    setIsCoinsModalOpen(false)
  }

  const handleLogout = () => {
    logout()
    closeSettingsPanel()
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
            <div className="w-10 h-10 rounded-full bg-secondary animate-pulse" />
            <div className="h-5 w-20 rounded bg-secondary animate-pulse" />
            <div className="w-10" />
          </div>
        </div>
        <div className="px-4 py-10 max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-secondary" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-6 w-40 rounded bg-secondary mx-auto md:mx-0" />
              <div className="h-4 w-28 rounded bg-secondary mx-auto md:mx-0" />
              <div className="h-10 w-48 rounded-full bg-secondary mx-auto md:mx-0" />
            </div>
          </div>
        </div>
        <BottomNavigation activeTab={navTab} onTabChange={setNavTab} onSearchClick={() => setIsSearchOpen(true)} />
      </main>
    )
  }

  // Guest view
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
            <Link href="/">
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Guest Content */}
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
            <span className="text-5xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Prysym TV</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Sign in to access your profile, save videos, track your watch history, and more.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={() => setIsAuthModalOpen(true)} className="rounded-full h-12">
              Sign In
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setIsAuthModalOpen(true)} 
              className="rounded-full h-12"
            >
              Create Account
            </Button>
          </div>

          {/* Features list */}
          <div className="mt-12 space-y-4 w-full max-w-sm">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Save your favorites</p>
                <p className="text-xs text-muted-foreground">Build your watchlist</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Continue watching</p>
                <p className="text-xs text-muted-foreground">Pick up where you left off</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Become a streamer</p>
                <p className="text-xs text-muted-foreground">Share your content live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab={navTab} 
          onTabChange={setNavTab}
          onSearchClick={() => setIsSearchOpen(true)}
        />

        {/* Modals */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
          <Link href="/">
            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <button
            type="button"
            onClick={() => (showSettings ? closeSettingsPanel() : openSettingsPanel("menu"))}
            className="flex items-center gap-2 rounded-full hover:bg-secondary transition-colors pl-1 pr-1 py-1"
            aria-label="Settings"
            aria-expanded={showSettings}
          >
            <span className="text-sm font-semibold text-foreground">Settings</span>
            <span className="w-10 h-10 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-foreground" />
            </span>
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-6 md:py-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative mb-4 md:mb-0">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"}
                alt="Profile"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-primary/20"
              />
              <button className="absolute bottom-0 right-0 md:bottom-2 md:right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform">
                <Edit3 className="w-4 h-4 text-primary-foreground" />
              </button>
              {user?.isStreamer && (
                <div className="absolute -top-1 -right-1 md:top-0 md:right-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-background">
                  <Radio className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Name & Username */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl md:text-3xl font-bold text-foreground">{user?.name}</h2>
                {user?.isStreamer && (
                  <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] uppercase tracking-wider font-bold">
                    Streamer
                  </span>
                )}
              </div>
              <p className="text-sm md:text-base text-muted-foreground mb-4">{user?.username}</p>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 w-full max-w-xs md:max-w-none md:w-auto">
                <Button className="flex-1 md:flex-none rounded-full px-8" onClick={() => setIsEditProfileOpen(true)}>Edit Profile</Button>
                {user?.isStreamer ? (
                  <Button
                    variant="secondary"
                    className="flex-1 md:flex-none rounded-full gap-2 px-6"
                    onClick={() => openSettingsPanel("go-live")}
                  >
                    <Radio className="w-4 h-4" />
                    Go Live
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    className="flex-1 md:flex-none rounded-full px-6"
                    onClick={() => setIsStreamerModalOpen(true)}
                  >
                    {user?.streamerStatus === "pending" ? "Pending..." : "Become Streamer"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6 w-full md:w-auto mt-4 md:mt-0">
            {/* Coins Display */}
            <button 
              onClick={() => setIsCoinsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 px-5 py-2.5 rounded-full border border-yellow-500/30 hover:border-yellow-500/50 hover:scale-105 transition-all duration-300 w-full md:w-auto"
            >
              <span className="text-xl">🪙</span>
              <span className="text-lg font-bold text-foreground">{(user?.coins || 0).toLocaleString()}</span>
              <span className="text-sm text-primary font-medium ml-1">+ Get More</span>
            </button>

            {/* Stats */}
            <div className="flex items-center justify-around md:justify-end gap-8 w-full md:w-auto">
              <div className="text-center md:text-right">
                <p className="text-lg md:text-xl font-bold text-foreground">12.5K</p>
                <p className="text-xs md:text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-lg md:text-xl font-bold text-foreground">342</p>
                <p className="text-xs md:text-sm text-muted-foreground">Following</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-lg md:text-xl font-bold text-foreground">48</p>
                <p className="text-xs md:text-sm text-muted-foreground">Videos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Watching */}
      <div className="px-4 mb-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Continue Watching
          </h3>
          <button
            type="button"
            onClick={() => openSettingsPanel("history")}
            className="text-xs text-primary font-medium"
          >
            See All
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {watchHistory.map((item) => (
            <Link key={item.id} href={`/watch/${item.id}`}>
              <div className="flex-shrink-0 w-44 cursor-pointer group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-2">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-foreground/90 flex items-center justify-center">
                      <Play className="w-4 h-4 text-background fill-background ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.channel}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center px-4 max-w-5xl mx-auto w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 border-b-2 transition-colors",
                  activeTab === tab.id 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 max-w-5xl mx-auto w-full">
        {activeTab === "videos" && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-3">
            {userVideos.map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`}>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group">
                  <img 
                    src={video.thumbnail} 
                    alt="Video"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-xs text-white font-medium">{video.views}</span>
                    <span className="text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">{video.duration}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "saved" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {savedItems.map((item) => (
              <Link key={item.id} href="/watch">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-xs text-primary font-medium">{item.type}</span>
                    <p className="text-sm text-white font-medium line-clamp-1">{item.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "liked" && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-3">
            {[...userVideos].reverse().map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`}>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group">
                  <img 
                    src={video.thumbnail} 
                    alt="Video"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2 right-2">
                    <Heart className="w-4 h-4 text-primary fill-primary" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={navTab} 
        onTabChange={setNavTab}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CoinsModal 
        isOpen={isCoinsModalOpen} 
        onClose={() => setIsCoinsModalOpen(false)} 
        currentCoins={user?.coins || 0}
        onPurchase={handlePurchaseCoins}
      />
      <StreamerApplicationModal 
        isOpen={isStreamerModalOpen} 
        onClose={() => setIsStreamerModalOpen(false)} 
      />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />

      <ProfileSettingsSheet
        isOpen={showSettings}
        onClose={closeSettingsPanel}
        user={user}
        darkModeEnabled={darkModeEnabled}
        onDarkModeToggle={() => setDarkModeEnabled(!darkModeEnabled)}
        onCoinsClick={() => {
          closeSettingsPanel()
          setIsCoinsModalOpen(true)
        }}
        onStreamerApply={() => {
          closeSettingsPanel()
          setIsStreamerModalOpen(true)
        }}
        onLogout={handleLogout}
        initialScreen={settingsOpenTo ?? initialSettingsScreen}
      />
    </main>
  )
}

function ProfileLoadingFallback() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pl-20">
      <div className="h-14 border-b border-border animate-pulse bg-secondary/30" />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="h-24 rounded-xl bg-secondary/50 animate-pulse" />
        <div className="h-40 rounded-xl bg-secondary/50 animate-pulse" />
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      <ProfilePageContent />
    </Suspense>
  )
}
