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
  ListMusic,
  Plus,
  ShoppingBag,
  Share2,
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
import { userAvatarUrl, profileBannerUrl } from "@/lib/user-avatar"
import { useSearchParams, useRouter } from "next/navigation"
import {
  fetchMySaved,
  fetchMyLiked,
} from "@/lib/api/users"
import { fetchHistory } from "@/lib/api/history"
import { filterContinueWatchingHistory } from "@/lib/continue-watching"
import { createCoinCheckout, fulfillCheckout } from "@/lib/api/billing"
import { ApiError } from "@/lib/api-client"
import type {
  HistoryItemRecord,
  LikedItemRecord,
  SavedItemRecord,
} from "@/lib/api/types"
import { mapHistoryToSettingsItems } from "@/lib/map-history"
import { mapLikedItemCard, mapSavedItemCard } from "@/lib/map-profile-items"
import { CreatorPermissionsCard } from "@/components/creator-permissions-card"
import { ProfileMyContent } from "@/components/profile-my-content"
import { ProfileStorePanel } from "@/components/profile-store-panel"
import { CreateFlowModals, openVerticalWizard } from "@/components/create-flow-modals"
import { CreateHeaderButton } from "@/components/create-header-button"
import { ShareSheet } from "@/components/share-sheet"
import { useCreateFlow } from "@/hooks/use-create-flow"
import {
  fetchMyPlaylists,
  type PlaylistSummary,
} from "@/lib/api/playlists"
import { ProfilePageSkeleton } from "@/components/content-skeletons"
import { profileAuthHref, safeReturnPath } from "@/lib/safe-return-path"

const baseTabs = [
  { id: "content", label: "Content", icon: Grid3X3 },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
] as const

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
  "shipping",
]

function ProfilePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const settingsParam = searchParams.get("settings")
  const tabParam = searchParams.get("tab")
  const createParam = searchParams.get("create")
  const returnTo = safeReturnPath(searchParams.get("returnTo"))
  const authParam = searchParams.get("auth")
  const initialSettingsScreen =
    settingsParam && VALID_SETTINGS_SCREENS.includes(settingsParam as ProfileSettingsScreen)
      ? (settingsParam as ProfileSettingsScreen)
      : undefined

  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState("content")
  const [showSettings, setShowSettings] = useState(false)
  const [settingsOpenTo, setSettingsOpenTo] = useState<ProfileSettingsScreen | undefined>()
  const [navTab, setNavTab] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState(false)
  const [coinsPurchasing, setCoinsPurchasing] = useState(false)
  const [coinsPurchaseError, setCoinsPurchaseError] = useState<string | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login")
  const [isStreamerModalOpen, setIsStreamerModalOpen] = useState(false)
  const [streamerModalPrefill, setStreamerModalPrefill] = useState<string | undefined>()
  const [streamerModalFeatures, setStreamerModalFeatures] = useState<
    Array<"live" | "vertical">
  >(["live"])
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [savedItems, setSavedItems] = useState<SavedItemRecord[]>([])
  const [likedItems, setLikedItems] = useState<LikedItemRecord[]>([])
  const [watchHistory, setWatchHistory] = useState<HistoryItemRecord[]>([])
  const [myPlaylists, setMyPlaylists] = useState<PlaylistSummary[]>([])
  const [tabsLoading, setTabsLoading] = useState(false)
  const createFlow = useCreateFlow()
  const { setMenuOpen: setCreateMenuOpen } = createFlow

  const tabs = [
    ...baseTabs,
    ...(user?.storeCreatorStatus === "approved"
      ? [{ id: "store" as const, label: "Store", icon: ShoppingBag }]
      : []),
  ]

  const openSettingsPanel = (screen: ProfileSettingsScreen = "menu") => {
    setSettingsOpenTo(screen)
    setShowSettings(true)
  }

  const closeSettingsPanel = () => {
    setShowSettings(false)
    setSettingsOpenTo(undefined)
  }

  useEffect(() => {
    if (isLoading || isAuthenticated) return
    if (authParam === "register") {
      setAuthModalMode("register")
      setIsAuthModalOpen(true)
    } else if (authParam === "login") {
      setAuthModalMode("login")
      setIsAuthModalOpen(true)
    }
  }, [authParam, isAuthenticated, isLoading])

  useEffect(() => {
    if (!user) return
    const avatar = userAvatarUrl(user.avatar, user.username ?? user.email ?? "user")
    const banner = profileBannerUrl(user.bannerUrl)
    if (avatar) {
      const img = new Image()
      img.src = avatar
    }
    if (banner) {
      const img = new Image()
      img.src = banner
    }
  }, [user?.avatar, user?.bannerUrl, user?.username, user?.email])

  useEffect(() => {
    if (!isLoading && isAuthenticated && returnTo) {
      router.replace(returnTo)
    }
  }, [isLoading, isAuthenticated, returnTo, router])

  useEffect(() => {
    if (initialSettingsScreen && initialSettingsScreen !== "menu" && isAuthenticated && !isLoading) {
      openSettingsPanel(initialSettingsScreen)
    }
  }, [initialSettingsScreen, isAuthenticated, isLoading])

  useEffect(() => {
    if (!createParam || !isAuthenticated || isLoading) return
    setCreateMenuOpen(true)
  }, [createParam, isAuthenticated, isLoading, setCreateMenuOpen])

  useEffect(() => {
    if (!tabParam || isLoading) return
    if (tabParam === "store" && user?.storeCreatorStatus === "approved") {
      setActiveTab("store")
    }
  }, [tabParam, isLoading, user?.storeCreatorStatus])

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) {
      setSavedItems([])
      setLikedItems([])
      setWatchHistory([])
      setMyPlaylists([])
      return
    }

    let cancelled = false
    async function loadProfileData() {
      setTabsLoading(true)
      try {
        const [savedRes, likedRes, historyRes, playlistsRes] =
          await Promise.all([
            fetchMySaved(1, 24),
            fetchMyLiked(1, 24),
            fetchHistory(1, 12),
            fetchMyPlaylists(),
          ])
        if (cancelled) return
        setSavedItems(savedRes.items)
        setLikedItems(likedRes.items)
        setWatchHistory(filterContinueWatchingHistory(historyRes.items))
        setMyPlaylists(playlistsRes.items)
      } catch {
        if (!cancelled) {
          setSavedItems([])
          setLikedItems([])
          setWatchHistory([])
          setMyPlaylists([])
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
    setCoinsPurchaseError(null)
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
    } catch (e) {
      setCoinsPurchaseError(
        e instanceof ApiError
          ? e.message
          : "Could not start checkout. Stripe may not be configured on the server.",
      )
    } finally {
      setCoinsPurchasing(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    closeSettingsPanel()
  }

  if (isLoading) {
    return <ProfilePageSkeleton />
  }

  // Guest view
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
            <Link
              href="/"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Back to home"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
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
            <Button
              onClick={() => {
                setAuthModalMode("login")
                setIsAuthModalOpen(true)
              }}
              className="rounded-full h-12"
            >
              Sign In
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setAuthModalMode("register")
                setIsAuthModalOpen(true)
              }}
              className="rounded-full h-12"
            >
              Create Account
            </Button>
          </div>

          {/* Member benefits */}
          <ul className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <li className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/40 px-4 py-5 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Bookmark className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Save your favorites</p>
              <p className="mt-1 text-xs text-muted-foreground">Build your watchlist</p>
            </li>
            <li className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/40 px-4 py-5 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Continue watching</p>
              <p className="mt-1 text-xs text-muted-foreground">Pick up where you left off</p>
            </li>
            <li className="flex flex-col items-center rounded-2xl border border-border/60 bg-card/40 px-4 py-5 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Become a streamer</p>
              <p className="mt-1 text-xs text-muted-foreground">Share your content live</p>
            </li>
          </ul>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab={navTab} 
          onTabChange={setNavTab}
        />

        {/* Modals */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => {
            if (returnTo) router.replace(returnTo)
          }}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto w-full">
          <Link
            href="/"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Back to home"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <div className="flex items-center gap-2">
            <CreateHeaderButton onClick={() => createFlow.setMenuOpen(true)} />
            <button
              type="button"
              onClick={() => (showSettings ? closeSettingsPanel() : openSettingsPanel("menu"))}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Settings"
              aria-expanded={showSettings}
            >
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-5xl mx-auto w-full">
        {profileBannerUrl(user?.bannerUrl) ? (
          <div className="h-32 md:h-44 w-full overflow-hidden bg-secondary">
            <img
              key={profileBannerUrl(user?.bannerUrl) ?? "no-banner"}
              src={profileBannerUrl(user?.bannerUrl) ?? ""}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-24 md:h-32 w-full bg-gradient-to-r from-primary/20 via-secondary to-primary/10" />
        )}

        <div className="px-4 py-6 md:py-10 md:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative -mt-14 md:-mt-16 mb-4 md:mb-0">
              <img
                key={userAvatarUrl(user?.avatar, user?.username ?? user?.email ?? "user")}
                src={userAvatarUrl(user?.avatar, user?.username ?? user?.email ?? "user")}
                alt="Profile"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-background"
              />
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute bottom-0 right-0 md:bottom-2 md:right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="Edit profile photo"
              >
                <Edit3 className="w-4 h-4 text-primary-foreground" />
              </button>
              {user?.streamerStatus === "approved" && (
                <div className="absolute -top-1 -right-1 md:top-0 md:right-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-background">
                  <Radio className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Name & Username */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl md:text-3xl font-bold text-foreground">{user?.name}</h2>
                {user?.streamerStatus === "approved" && (
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
              <div className="flex items-center justify-center md:justify-start gap-3 w-full max-w-xs md:max-w-none md:w-auto flex-wrap">
                <Button className="flex-1 md:flex-none rounded-full px-8" onClick={() => setIsEditProfileOpen(true)}>Edit Profile</Button>
                <Button
                  variant="outline"
                  className="flex-1 md:flex-none rounded-full gap-2 px-6"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="w-4 h-4" />
                  Share profile
                </Button>
                {user?.streamerStatus === "approved" && (
                  <Button
                    variant="secondary"
                    className="flex-1 md:flex-none rounded-full gap-2 px-6"
                    onClick={() => openSettingsPanel("go-live")}
                  >
                    <Radio className="w-4 h-4" />
                    Go Live
                  </Button>
                )}
              </div>

              <div className="w-full max-w-md md:max-w-lg mt-2">
                <CreatorPermissionsCard
                  user={user}
                  onUnlock={() => createFlow.setUnlockOpen(true)}
                />
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
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 border-b-2 transition-colors min-w-0",
                  activeTab === tab.id 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium leading-tight text-center truncate max-w-full px-0.5">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 max-w-5xl mx-auto w-full">
        {activeTab === "content" && (
          <ProfileMyContent
            onOpenVerticalUpload={() => openSettingsPanel("verticals")}
            onOpenPodcastUpload={() => openSettingsPanel("podcasts")}
          />
        )}

        {activeTab === "playlists" && !tabsLoading && myPlaylists.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <ProfileEmpty message="No playlists yet. Create one in Settings → Playlists, or when you upload." />
            <Button
              variant="outline"
              className="rounded-full gap-2"
              onClick={() => openSettingsPanel("playlists")}
            >
              <Plus className="w-4 h-4" />
              Manage playlists
            </Button>
          </div>
        ) : null}

        {activeTab === "playlists" && myPlaylists.length > 0 ? (
          <ul className="space-y-2">
            {myPlaylists.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/playlist/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <ListMusic className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.itemCount} item{p.itemCount === 1 ? "" : "s"} · {p.type}
                      {p.visibility === "private" ? " · private" : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
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

        {activeTab === "store" && user?.storeCreatorStatus === "approved" && (
          <ProfileStorePanel />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={navTab} 
        onTabChange={setNavTab}
      />

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CoinsModal
        isOpen={isCoinsModalOpen}
        onClose={() => {
          setIsCoinsModalOpen(false)
          setCoinsPurchaseError(null)
        }}
        currentCoins={user?.coins || 0}
        onPurchasePackage={handlePurchasePackage}
        purchasing={coinsPurchasing}
        purchaseError={coinsPurchaseError}
      />
      <StreamerApplicationModal
        isOpen={isStreamerModalOpen}
        initialDescription={streamerModalPrefill}
        features={streamerModalFeatures}
        onClose={() => {
          setIsStreamerModalOpen(false)
          setStreamerModalPrefill(undefined)
          setStreamerModalFeatures(["live"])
        }}
      />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={user?.name ? `${user.name} on Prysym` : "My profile"}
        url={
          user?.username && typeof window !== "undefined"
            ? `${window.location.origin}/creator/${user.username.replace(/^@/, "")}`
            : undefined
        }
      />

      <CreateFlowModals
        flow={createFlow}
        onOpenSettings={(screen) => openSettingsPanel(screen)}
        onNeedCreatorVerification={(ctx) => {
          setStreamerModalPrefill(ctx.description)
          const idFeatures = ctx.features.filter(
            (f): f is "live" | "vertical" => f !== "store",
          )
          setStreamerModalFeatures(idFeatures.length > 0 ? idFeatures : ["live"])
          setIsStreamerModalOpen(true)
        }}
        onUploadSuccess={() => void refreshUser()}
      />

      <ProfileSettingsSheet
        isOpen={showSettings}
        onClose={closeSettingsPanel}
        user={user}
        onCoinsClick={() => {
          closeSettingsPanel()
          setIsCoinsModalOpen(true)
        }}
        onStreamerApply={() => {
          closeSettingsPanel()
          setStreamerModalFeatures(["live"])
          setIsStreamerModalOpen(true)
        }}
        onVerticalCreatorApply={() => {
          closeSettingsPanel()
          createFlow.setUnlockPreselect("vertical")
          createFlow.setUnlockOpen(true)
        }}
        onLogout={handleLogout}
        onRefreshUser={refreshUser}
        initialScreen={settingsOpenTo ?? initialSettingsScreen}
      />
    </main>
  )
}

function ProfileLoadingFallback() {
  return <ProfilePageSkeleton />
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      <ProfilePageContent />
    </Suspense>
  )
}
