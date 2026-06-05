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
import { userAvatarUrl } from "@/lib/user-avatar"
import { useSearchParams } from "next/navigation"
import {
  fetchMyVideos,
  fetchMySaved,
  fetchMyLiked,
} from "@/lib/api/users"
import { fetchHistory } from "@/lib/api/history"
import { createCoinCheckout, fulfillCheckout } from "@/lib/api/billing"
import type {
  HistoryItemRecord,
  LikedItemRecord,
  SavedItemRecord,
  VideoRecord,
} from "@/lib/api/types"
import {
  formatDuration,
  formatViewCount,
  videoThumbnail,
} from "@/lib/format-media"
import { mapHistoryToSettingsItems } from "@/lib/map-history"
import { mapLikedItemCard, mapSavedItemCard } from "@/lib/map-profile-items"

const tabs = [
  { id: "videos", label: "Videos", icon: Grid3X3 },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
]

function ProfileEmpty({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

const VALID_SETTINGS_SCREENS: ProfileSettingsScreen[] = [
  "menu",
  "notifications",
  "dashboard",
  "help",
  "premium",
  "history",
  "go-live",
  "upload",
  "verticals",
  "podcasts",
  "playlists",
  "social",
]

function ProfilePageContent() {
  const searchParams = useSearchParams()
  const settingsParam = searchParams.get("settings")
  const initialSettingsScreen =
    settingsParam && VALID_SETTINGS_SCREENS.includes(settingsParam as ProfileSettingsScreen)
      ? (settingsParam as ProfileSettingsScreen)
      : undefined

  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState("videos")
  const [showSettings, setShowSettings] = useState(false)
  const [settingsOpenTo, setSettingsOpenTo] = useState<ProfileSettingsScreen | undefined>()
  const [navTab, setNavTab] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false)
  const [coinsPurchasing, setCoinsPurchasing] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isStreamerModalOpen, setIsStreamerModalOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [darkModeEnabled, setDarkModeEnabled] = useState(true)
  const [myVideos, setMyVideos] = useState<VideoRecord[]>([])
  const [savedItems, setSavedItems] = useState<SavedItemRecord[]>([])
  const [likedItems, setLikedItems] = useState<LikedItemRecord[]>([])
  const [watchHistory, setWatchHistory] = useState<HistoryItemRecord[]>([])
  const [tabsLoading, setTabsLoading] = useState(false)

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

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) {
      setMyVideos([])
      setSavedItems([])
      setLikedItems([])
      setWatchHistory([])
      return
    }

    let cancelled = false
    async function loadProfileData() {
      setTabsLoading(true)
      try {
        const [videosRes, savedRes, likedRes, historyRes] = await Promise.all([
          fetchMyVideos(1, 24),
          fetchMySaved(1, 24),
          fetchMyLiked(1, 24),
          fetchHistory(1, 12),
        ])
        if (cancelled) return
        setMyVideos(videosRes.items)
        setSavedItems(savedRes.items)
        setLikedItems(likedRes.items)
        setWatchHistory(historyRes.items)
      } catch {
        if (!cancelled) {
          setMyVideos([])
          setSavedItems([])
          setLikedItems([])
          setWatchHistory([])
        }
      } finally {
        if (!cancelled) setTabsLoading(false)
      }
    }

    void loadProfileData()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isLoading, user?.id])

  useEffect(() => {
    const checkout = searchParams.get("checkout")
    const sessionId = searchParams.get("session_id")
    if (checkout !== "success" || !sessionId || !isAuthenticated) return
    void fulfillCheckout(sessionId)
      .then(() => refreshUser())
      .catch(() => refreshUser())
  }, [searchParams, isAuthenticated, refreshUser])

  const handlePurchasePackage = async (packageId: string) => {
    setCoinsPurchasing(true)
    try {
      const res = await createCoinCheckout(packageId)
      if (res.devMode) {
        await refreshUser()
        setIsCoinsModalOpen(false)
        return
      }
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } catch {
      /* modal stays open */
    } finally {
      setCoinsPurchasing(false)
    }
  }

  const handleLogout = async () => {
    await logout()
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
        <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
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
                src={userAvatarUrl(user?.avatar, user?.username ?? user?.email ?? "user")}
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
              <p className="text-sm md:text-base text-muted-foreground">{user?.username}</p>
              {user?.bio ? (
                <p className="text-sm text-muted-foreground mt-2 mb-4 max-w-md line-clamp-3">
                  {user.bio}
                </p>
              ) : (
                <div className="mb-4" />
              )}
              
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
                <p className="text-lg md:text-xl font-bold text-foreground">
                  {(user?.followersCount ?? 0).toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-lg md:text-xl font-bold text-foreground">
                  {(user?.followingCount ?? 0).toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">Following</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-lg md:text-xl font-bold text-foreground">
                  {(user?.videosCount ?? 0).toLocaleString()}
                </p>
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
          {tabsLoading && watchHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Loading history…</p>
          ) : watchHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No watch history yet. Content you play will appear here.
            </p>
          ) : (
            mapHistoryToSettingsItems(watchHistory).map((item) => (
              <Link key={item.id} href={item.href}>
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
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-1">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.channel}</p>
                </div>
              </Link>
            ))
          )}
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
        {tabsLoading && activeTab === "videos" && myVideos.length === 0 ? (
          <ProfileEmpty message="Loading your videos…" />
        ) : null}

        {activeTab === "videos" && !tabsLoading && myVideos.length === 0 ? (
          <ProfileEmpty message="You have not uploaded any videos yet. Open Settings → Your Videos to upload." />
        ) : null}

        {activeTab === "videos" && myVideos.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-3">
            {myVideos.map((video) => (
              <Link key={video.id} href={`/watch/${video.id}`}>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group">
                  <img
                    src={videoThumbnail(video.thumbnailUrl)}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-xs text-white font-medium">
                      {formatViewCount(video.viewsCount)}
                    </span>
                    <span className="text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {activeTab === "saved" && !tabsLoading && savedItems.length === 0 ? (
          <ProfileEmpty message="Nothing saved yet. Tap Save on any video, short, podcast, or vertical episode." />
        ) : null}

        {activeTab === "saved" && savedItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {savedItems
              .map((item) => mapSavedItemCard(item))
              .filter((card): card is NonNullable<typeof card> => card !== null)
              .map((card) => (
                <Link key={card.key} href={card.href}>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group">
                    <img
                      src={card.thumbnail}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-xs text-primary font-medium">{card.label}</span>
                      <p className="text-sm text-white font-medium line-clamp-1">{card.title}</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        ) : null}

        {activeTab === "liked" && !tabsLoading && likedItems.length === 0 ? (
          <ProfileEmpty message="Nothing liked yet. Like videos, podcasts, or vertical episodes as you browse." />
        ) : null}

        {activeTab === "liked" && likedItems.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-3">
            {likedItems
              .map((item) => mapLikedItemCard(item))
              .filter((card): card is NonNullable<typeof card> => card !== null)
              .map((card) => (
                <Link key={card.key} href={card.href}>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group">
                    <img
                      src={card.thumbnail}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-2 right-2">
                      <Heart className="w-4 h-4 text-primary fill-primary" />
                    </div>
                    <p className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] text-white line-clamp-2">
                      {card.title}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        ) : null}
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
        onPurchasePackage={handlePurchasePackage}
        purchasing={coinsPurchasing}
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
        onRefreshUser={refreshUser}
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
