"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Crown,
  Radio,
  Clock,
  Video,
  BarChart3,
  Bell,
  Moon,
  HelpCircle,
  LogOut,
  Check,
  Mail,
  MessageSquare,
  Trash2,
  Play,
  Copy,
  Key,
  Upload,
  Film,
  Headphones,
  ListMusic,
  Link2,
  Users,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { User } from "@/contexts/auth-context"
import { uploadVideoFlow, pollVideoUntilReady, getVideoUploadMaxBytes } from "@/lib/api/videos"
import { fetchStreamIngestHealth, initStream, getRtmpIngestUrl } from "@/lib/api/streams"
import { createPremiumCheckout } from "@/lib/api/billing"
import { fetchPublicConfig, type PublicMembershipConfig } from "@/lib/api/config"
import { isPremiumActive } from "@/lib/premium"
import { ApiError } from "@/lib/api-client"
import { clearHistory, deleteHistoryItem, fetchHistory } from "@/lib/api/history"
import {
  fetchNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/api/notifications"
import { mapHistoryToSettingsItems, type SettingsHistoryItem } from "@/lib/map-history"
import { fetchMyVerticalSeries } from "@/lib/api/verticals-admin"
import { VerticalSeriesWizard } from "@/components/vertical-series-wizard"
import { VerticalSeriesEpisodesPanel } from "@/components/vertical-series-episodes-panel"
import {
  createPodcastShow,
  fetchMyPodcastShows,
  uploadPodcastEpisodeFlow,
  uploadPodcastShowCover,
  type MyPodcastShow,
} from "@/lib/api/podcasts-admin"
import {
  createPlaylist,
  deletePlaylist,
  fetchMyPlaylists,
  type PlaylistSummary,
} from "@/lib/api/playlists"
import {
  fetchPodcastCategories,
  fetchVideoCategories,
  type ContentCategory,
} from "@/lib/api/categories"
import { CreatorDashboardPanel } from "@/components/creator-dashboard-panel"
import {
  cancelCreatorSubscription,
  fetchMyCreatorSubscriptions,
  type CreatorSubscription,
} from "@/lib/api/billing-monetization"
import { fetchMe, replaceSocialLinks, updateMe } from "@/lib/api/users"
import { BuyerDetailsForm } from "@/components/buyer-details-form"
import {
  buyerDetailsFromUser,
  buyerDetailsToUpdateMeBody,
  EMPTY_BUYER_DETAILS,
  type BuyerDetails,
} from "@/lib/buyer-details"
import { formatViewCount } from "@/lib/format-media"

export type ProfileSettingsScreen =
  | "menu"
  | "notifications"
  | "dashboard"
  | "help"
  | "premium"
  | "history"
  | "go-live"
  | "upload"
  | "verticals"
  | "podcasts"
  | "playlists"
  | "social"
  | "shipping"

const NOTIFICATION_PREFS = [
  { id: "follow", label: "New followers", description: "When someone follows you" },
  { id: "like", label: "Likes", description: "When someone likes your videos or comments" },
  { id: "comment", label: "Comments & replies", description: "When someone comments on your videos or replies to you" },
  { id: "live", label: "Live alerts", description: "When creators you follow go live" },
  { id: "upload", label: "New uploads", description: "When subscribed creators post" },
  { id: "gift", label: "Gifts received", description: "When you receive a gift on stream" },
  { id: "system", label: "System updates", description: "Platform news and milestones" },
]

function canAccessCreatorDashboard(user: User | null): boolean {
  if (!user) return false
  if (user.role === "admin" || user.role === "creator") return true
  return (user.videosCount ?? 0) > 0
}

const FAQS = [
  { q: "How do I upload a video?", a: "Tap the + button in the header and choose Short, Long video, Podcast, or Micro-drama series." },
  { q: "How do I become a streamer?", a: "Apply from Settings → Become a Streamer. Once approved, use Go Live." },
  { q: "What are Coins?", a: "Coins let you send gifts during live streams and support creators." },
  { q: "How do I report content?", a: "Use the flag icon on any video, movie, or live stream page." },
]

const DEFAULT_MEMBERSHIP: PublicMembershipConfig = {
  priceUsd: 4.99,
  label: "Prysym Membership",
  perks: ["Ad-free on Shorts, Verticals, and Movies", "Skip movie preroll ads"],
}

const UPLOAD_TYPES = [
  { id: "short", label: "Short", icon: Video, description: "Vertical short-form (under 60s)" },
  { id: "video", label: "Video", icon: Video, description: "Long-form video" },
]

/** Desktop-optimized sheet sizing (md+). */
const SHEET_SHELL =
  "absolute bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 bg-background rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 max-h-[88vh] md:max-h-[min(820px,90vh)] md:border md:border-border/80"
const SHEET_SIZE_DESKTOP =
  "md:w-[min(920px,96vw)] lg:w-[980px] md:h-[90vh] md:max-h-[92vh] md:min-h-[90vh]"
const SHEET_HEADER = "flex items-center gap-2 px-4 py-4 md:px-8 md:py-5 border-b border-border shrink-0"
const SHEET_TITLE = "flex-1 text-center text-lg md:text-xl font-semibold truncate"
const SHEET_BODY = "flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-8 md:pb-10"

const SCREEN_TITLES: Record<Exclude<ProfileSettingsScreen, "menu">, string> = {
  notifications: "Notifications",
  dashboard: "Performance & Revenue",
  help: "Help & Support",
  premium: "Premium",
  history: "Watch History",
  "go-live": "Go Live",
  upload: "Upload",
  verticals: "Micro-dramas",
  podcasts: "Podcasts",
  playlists: "Playlists",
  social: "Social Links",
  shipping: "Shipping & checkout",
}

interface ProfileSettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  darkModeEnabled: boolean
  onDarkModeToggle: () => void
  onCoinsClick: () => void
  onStreamerApply: () => void
  onVerticalCreatorApply: () => void
  onLogout: () => void
  onRefreshUser?: () => Promise<void>
  /** Open directly to a sub-panel (e.g. from /profile?settings=notifications) */
  initialScreen?: ProfileSettingsScreen
}

export function ProfileSettingsSheet({
  isOpen,
  onClose,
  user,
  darkModeEnabled,
  onDarkModeToggle,
  onCoinsClick,
  onStreamerApply,
  onVerticalCreatorApply,
  onLogout,
  onRefreshUser,
  initialScreen,
}: ProfileSettingsSheetProps) {
  const router = useRouter()
  const [screen, setScreen] = useState<ProfileSettingsScreen>("menu")
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, true]))
  )
  const [membership, setMembership] = useState<PublicMembershipConfig>(DEFAULT_MEMBERSHIP)
  const [premiumActive, setPremiumActive] = useState(false)
  const [premiumBusy, setPremiumBusy] = useState(false)
  const [premiumError, setPremiumError] = useState<string | null>(null)
  const [historyItems, setHistoryItems] = useState<SettingsHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [streamKey, setStreamKey] = useState<string | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)
  const [rtmpUrl, setRtmpUrl] = useState(() => getRtmpIngestUrl())
  const [goLiveError, setGoLiveError] = useState<string | null>(null)
  const [goLiveLoading, setGoLiveLoading] = useState(false)
  const [streamTitle, setStreamTitle] = useState("")
  const [streamCategory, setStreamCategory] = useState("General")
  const [liveCategoryOptions, setLiveCategoryOptions] = useState<ContentCategory[]>([])
  const [copied, setCopied] = useState(false)
  const [goLiveMode, setGoLiveMode] = useState<"camera" | "obs">("camera")
  const [ingestHealth, setIngestHealth] = useState<{
    rtmpReachable: boolean
    hint: string
  } | null>(null)
  const [uploadType, setUploadType] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [uploadProcessing, setUploadProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)
  const [verticalWizardOpen, setVerticalWizardOpen] = useState(false)
  const [verticalWizardIntent, setVerticalWizardIntent] = useState<
    "new_series" | "add_episode" | undefined
  >()
  const [myPodcastShows, setMyPodcastShows] = useState<MyPodcastShow[]>([])
  const [podcastShowTitle, setPodcastShowTitle] = useState("")
  const [podcastShowCategory, setPodcastShowCategory] = useState("General")
  const [podcastCategoryOptions, setPodcastCategoryOptions] = useState<ContentCategory[]>([
    { slug: "general", label: "General" },
  ])
  const [podcastEpisodeShowId, setPodcastEpisodeShowId] = useState("")
  const [podcastEpisodeTitle, setPodcastEpisodeTitle] = useState("")
  const [podcastAudioFile, setPodcastAudioFile] = useState<File | null>(null)
  const [podcastShowCoverFile, setPodcastShowCoverFile] = useState<File | null>(null)
  const [podcastBusy, setPodcastBusy] = useState(false)
  const [podcastMessage, setPodcastMessage] = useState<string | null>(null)
  const [myPlaylists, setMyPlaylists] = useState<PlaylistSummary[]>([])
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("")
  const [playlistBusy, setPlaylistBusy] = useState(false)
  const [socialLinks, setSocialLinks] = useState<
    Array<{ label: string; url: string; sortOrder: number }>
  >([])
  const [socialBusy, setSocialBusy] = useState(false)
  const [socialMessage, setSocialMessage] = useState<string | null>(null)
  const [buyerDetails, setBuyerDetails] = useState<BuyerDetails>(EMPTY_BUYER_DETAILS)
  const [buyerBusy, setBuyerBusy] = useState(false)
  const [buyerMessage, setBuyerMessage] = useState<string | null>(null)
  const [mySeries, setMySeries] = useState<
    Array<{
      id: string
      slug: string
      title: string
      episodes: Array<{
        id: string
        episodeNumber: number
        title: string
        description?: string | null
        cliffhanger?: string | null
      }>
    }>
  >([])

  useEffect(() => {
    if (!isOpen) {
      setScreen("menu")
      return
    }
    if (initialScreen && initialScreen !== "menu") {
      setScreen(initialScreen)
    }
  }, [isOpen, initialScreen])

  useEffect(() => {
    if (!isOpen || screen !== "verticals") return
    void fetchMyVerticalSeries()
      .then((res) => setMySeries(res.items))
      .catch(() => setMySeries([]))
  }, [isOpen, screen])

  useEffect(() => {
    if (!isOpen || screen !== "go-live") return
    void fetchStreamIngestHealth()
      .then((h) => setIngestHealth({ rtmpReachable: h.rtmpReachable, hint: h.hint }))
      .catch(() =>
        setIngestHealth({
          rtmpReachable: false,
          hint: "Could not check RTMP ingest. Run: docker compose up -d mediamtx",
        }),
      )
    void fetchVideoCategories()
      .then((res) => {
        if (res.items.length > 0) {
          setLiveCategoryOptions(res.items)
          setStreamCategory((prev) =>
            res.items.some((c) => c.label === prev) ? prev : res.items[0].label,
          )
        }
      })
      .catch(() => setLiveCategoryOptions([]))
  }, [isOpen, screen])

  useEffect(() => {
    if (!isOpen || screen !== "podcasts") return
    void fetchMyPodcastShows()
      .then((res) => setMyPodcastShows(res.items))
      .catch(() => setMyPodcastShows([]))
    void fetchPodcastCategories()
      .then((res) => {
        if (res.items.length > 0) {
          setPodcastCategoryOptions(res.items)
          setPodcastShowCategory((prev) =>
            res.items.some((c) => c.label === prev) ? prev : res.items[0].label,
          )
        }
      })
      .catch(() => {})
  }, [isOpen, screen])

  useEffect(() => {
    if (!isOpen || screen !== "playlists") return
    void fetchMyPlaylists()
      .then((res) => setMyPlaylists(res.items))
      .catch(() => setMyPlaylists([]))
  }, [isOpen, screen])

  useEffect(() => {
    if (!isOpen || screen !== "social") return
    void fetchMe()
      .then((me) => {
        const links = (me.socialLinks ?? []) as Array<{
          label: string
          url: string
          sortOrder: number
        }>
        setSocialLinks(
          links.length
            ? links
            : [{ label: "Website", url: "", sortOrder: 0 }],
        )
      })
      .catch(() => setSocialLinks([{ label: "Website", url: "", sortOrder: 0 }]))
  }, [isOpen, screen])

  useEffect(() => {
    if (!isOpen || screen !== "history") return
    setHistoryLoading(true)
    void fetchHistory(1, 40)
      .then((res) => setHistoryItems(mapHistoryToSettingsItems(res.items)))
      .catch(() => setHistoryItems([]))
      .finally(() => setHistoryLoading(false))
  }, [isOpen, screen])

  useEffect(() => {
    if (!user) return
    setPremiumActive(isPremiumActive(user.premiumTier, user.premiumExpiresAt))
  }, [user, isOpen])

  useEffect(() => {
    if (!isOpen || screen !== "premium") return
    void fetchPublicConfig()
      .then((cfg) => setMembership(cfg.membership ?? DEFAULT_MEMBERSHIP))
      .catch(() => setMembership(DEFAULT_MEMBERSHIP))
  }, [isOpen, screen])

  useEffect(() => {
    if (!isOpen || screen !== "notifications") return
    setNotifLoading(true)
    void fetchNotificationPreferences()
      .then((prefs) => {
        const next = Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, true]))
        for (const pref of prefs) {
          next[pref.type] = pref.enabled
        }
        setNotifSettings(next)
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => setNotifLoading(false))
  }, [isOpen, screen])

  useEffect(() => {
    if (!isOpen || screen !== "shipping") return
    setBuyerMessage(null)
    void fetchMe()
      .then((me) => setBuyerDetails(buyerDetailsFromUser(me)))
      .catch(() => setBuyerDetails(EMPTY_BUYER_DETAILS))
  }, [isOpen, screen])

  if (!isOpen) return null

  const goTo = (next: ProfileSettingsScreen) => setScreen(next)
  const goBack = () => setScreen("menu")

  const handleClose = () => {
    setScreen("menu")
    onClose()
  }

  const isStreamer = user?.streamerStatus === "approved"
  const isVerticalCreator =
    user?.isVerticalCreator || user?.verticalCreatorStatus === "approved"

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={cn(SHEET_SHELL, SHEET_SIZE_DESKTOP)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Profile settings"
      >
        {/* Header */}
        <div className={SHEET_HEADER}>
          {screen !== "menu" ? (
            <button
              type="button"
              onClick={goBack}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              aria-label="Back to settings menu"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          ) : (
            <div className="w-10 md:w-11 shrink-0" aria-hidden />
          )}
          {screen === "menu" ? (
            <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
              <div
                className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0"
                aria-hidden
              >
                <Settings className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground truncate">Settings</h2>
            </div>
          ) : (
            <h2 className={SHEET_TITLE}>{SCREEN_TITLES[screen]}</h2>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="w-12 h-1 rounded-full bg-muted mx-auto -mt-2 mb-2 md:hidden shrink-0" />

        <div className={SHEET_BODY}>
          {screen === "menu" && (
            <MenuPanel
              user={user}
              isStreamer={isStreamer}
              showCreatorDashboard={canAccessCreatorDashboard(user)}
              darkModeEnabled={darkModeEnabled}
              onDarkModeToggle={onDarkModeToggle}
              onCoinsClick={onCoinsClick}
              onNavigate={goTo}
              onStreamerApply={() => {
                handleClose()
                onStreamerApply()
              }}
              onLogout={() => {
                handleClose()
                onLogout()
              }}
            />
          )}

          {screen === "notifications" && (
            <NotificationsPanel
              settings={notifSettings}
              loading={notifLoading}
              onToggle={(id, enabled) => {
                setNotifSettings((s) => ({ ...s, [id]: enabled }))
                void updateNotificationPreference(id, enabled).catch(() => {
                  setNotifSettings((s) => ({ ...s, [id]: !enabled }))
                })
              }}
            />
          )}

          {screen === "dashboard" &&
            (canAccessCreatorDashboard(user) ? (
              <CreatorDashboardPanel />
            ) : (
              <p className="text-sm text-muted-foreground pt-4">
                Creator analytics are available after you publish content or receive creator access.
              </p>
            ))}

          {screen === "help" && <HelpPanel />}

          {screen === "premium" && (
            <PremiumPanel
              membership={membership}
              subscribed={premiumActive}
              busy={premiumBusy}
              error={premiumError}
              onSubscribe={async () => {
                setPremiumBusy(true)
                setPremiumError(null)
                try {
                  const res = await createPremiumCheckout("membership")
                  if (res.devMode) {
                    setPremiumActive(true)
                    await onRefreshUser?.()
                    return
                  }
                  if (res.checkoutUrl) {
                    window.location.href = res.checkoutUrl
                  }
                } catch (e) {
                  setPremiumError(
                    e instanceof ApiError
                      ? e.message
                      : e instanceof Error
                        ? e.message
                        : "Could not start checkout",
                  )
                } finally {
                  setPremiumBusy(false)
                }
              }}
            />
          )}

          {screen === "history" && (
            <HistoryPanel
              items={historyItems}
              loading={historyLoading}
              onClear={() => {
                void clearHistory()
                  .then(() => setHistoryItems([]))
                  .catch(() => setHistoryItems([]))
              }}
              onDelete={(item) => {
                void deleteHistoryItem(item.contentType, item.contentId)
                  .then(() =>
                    setHistoryItems((prev) => prev.filter((h) => h.id !== item.id)),
                  )
                  .catch(() => {})
              }}
              onOpen={(href) => {
                handleClose()
                router.push(href)
              }}
            />
          )}

          {screen === "go-live" && (
            <GoLivePanel
              user={user}
              isStreamer={isStreamer}
              title={streamTitle}
              category={streamCategory}
              streamKey={streamKey}
              rtmpUrl={rtmpUrl}
              copied={copied}
              loading={goLiveLoading}
              error={goLiveError}
              ingestHealth={ingestHealth}
              mode={goLiveMode}
              categoryOptions={liveCategoryOptions}
              onModeChange={setGoLiveMode}
              onTitleChange={setStreamTitle}
              onCategoryChange={setStreamCategory}
              onGenerateKey={async () => {
                if (!streamTitle.trim()) return
                setGoLiveLoading(true)
                setGoLiveError(null)
                try {
                  const res = await initStream(streamTitle.trim(), streamCategory)
                  setStreamKey(res.streamKey)
                  setStreamId(res.streamId)
                  setRtmpUrl(res.rtmpUrl || getRtmpIngestUrl())
                  if (goLiveMode === "camera") {
                    handleClose()
                    router.push(`/live/${res.streamId}?studio=camera`)
                  }
                } catch (e) {
                  setGoLiveError(
                    e instanceof ApiError
                      ? e.message
                      : e instanceof Error
                        ? e.message
                        : "Could not start stream",
                  )
                } finally {
                  setGoLiveLoading(false)
                }
              }}
              onCopy={async () => {
                if (!streamKey) return
                const text = `Server: ${rtmpUrl}\nStream key: ${streamKey}`
                await navigator.clipboard.writeText(text)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              onOpenLive={() => {
                if (!streamId) return
                handleClose()
                router.push(`/live/${streamId}?studio=${goLiveMode}`)
              }}
              onApplyStreamer={() => {
                handleClose()
                onStreamerApply()
              }}
            />
          )}

          {screen === "verticals" && !isVerticalCreator && (
            <VerticalCreatorGatePanel
              user={user}
              onApply={() => {
                handleClose()
                onVerticalCreatorApply()
              }}
            />
          )}

          {screen === "verticals" && isVerticalCreator && (
            <div className="space-y-5 pt-2">
              <p className="text-sm text-muted-foreground">
                Create a series with cover art and description, then upload vertical episodes in order.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="rounded-full w-full"
                  onClick={() => {
                    setVerticalWizardIntent("new_series")
                    setVerticalWizardOpen(true)
                  }}
                >
                  Create new series
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full w-full"
                  disabled={mySeries.length === 0}
                  onClick={() => {
                    setVerticalWizardIntent("add_episode")
                    setVerticalWizardOpen(true)
                  }}
                >
                  Add episode to series
                </Button>
              </div>
              {mySeries.length > 0 && (
                <VerticalSeriesEpisodesPanel
                  series={mySeries}
                  onChanged={() => {
                    void fetchMyVerticalSeries()
                      .then((res) => setMySeries(res.items))
                      .catch(() => setMySeries([]))
                  }}
                />
              )}
            </div>
          )}

          {screen === "podcasts" && (
            <PodcastCreatorPanel
              shows={myPodcastShows}
              showTitle={podcastShowTitle}
              showCategory={podcastShowCategory}
              categoryOptions={podcastCategoryOptions}
              episodeShowId={podcastEpisodeShowId}
              episodeTitle={podcastEpisodeTitle}
              audioFile={podcastAudioFile}
              showCoverFile={podcastShowCoverFile}
              busy={podcastBusy}
              message={podcastMessage}
              onShowTitleChange={setPodcastShowTitle}
              onShowCategoryChange={setPodcastShowCategory}
              onEpisodeShowIdChange={setPodcastEpisodeShowId}
              onEpisodeTitleChange={setPodcastEpisodeTitle}
              onAudioFileChange={setPodcastAudioFile}
              onShowCoverFileChange={setPodcastShowCoverFile}
              onCreateShow={async () => {
                if (!podcastShowTitle.trim()) return
                setPodcastBusy(true)
                setPodcastMessage(null)
                try {
                  const show = await createPodcastShow({
                    title: podcastShowTitle.trim(),
                    category: podcastShowCategory.trim(),
                  })
                  if (podcastShowCoverFile) {
                    await uploadPodcastShowCover(show.id, podcastShowCoverFile)
                  }
                  setPodcastEpisodeShowId(show.id)
                  setPodcastShowCoverFile(null)
                  setPodcastMessage("Show created.")
                  const res = await fetchMyPodcastShows()
                  setMyPodcastShows(res.items)
                } catch (e) {
                  setPodcastMessage(e instanceof Error ? e.message : "Failed")
                } finally {
                  setPodcastBusy(false)
                }
              }}
              onUploadEpisode={async () => {
                if (!podcastEpisodeShowId || !podcastEpisodeTitle.trim() || !podcastAudioFile) return
                setPodcastBusy(true)
                setPodcastMessage(null)
                try {
                  await uploadPodcastEpisodeFlow(
                    podcastEpisodeShowId,
                    podcastEpisodeTitle.trim(),
                    podcastAudioFile,
                  )
                  setPodcastMessage("Episode published.")
                  setPodcastAudioFile(null)
                  const res = await fetchMyPodcastShows()
                  setMyPodcastShows(res.items)
                } catch (e) {
                  setPodcastMessage(e instanceof Error ? e.message : "Upload failed")
                } finally {
                  setPodcastBusy(false)
                }
              }}
            />
          )}

          {screen === "playlists" && (
            <PlaylistsManagePanel
              playlists={myPlaylists}
              newTitle={newPlaylistTitle}
              busy={playlistBusy}
              onNewTitleChange={setNewPlaylistTitle}
              onCreate={async () => {
                if (!newPlaylistTitle.trim()) return
                setPlaylistBusy(true)
                try {
                  await createPlaylist({
                    title: newPlaylistTitle.trim(),
                    type: "mixed",
                  })
                  setNewPlaylistTitle("")
                  const res = await fetchMyPlaylists()
                  setMyPlaylists(res.items)
                } finally {
                  setPlaylistBusy(false)
                }
              }}
              onDelete={async (id) => {
                setPlaylistBusy(true)
                try {
                  await deletePlaylist(id)
                  const res = await fetchMyPlaylists()
                  setMyPlaylists(res.items)
                } finally {
                  setPlaylistBusy(false)
                }
              }}
            />
          )}

          {screen === "social" && (
            <SocialLinksPanel
              links={socialLinks}
              busy={socialBusy}
              message={socialMessage}
              onChange={setSocialLinks}
              onSave={async () => {
                setSocialBusy(true)
                setSocialMessage(null)
                try {
                  const payload = socialLinks
                    .filter((l) => l.label.trim() && l.url.trim())
                    .map((l, i) => ({
                      label: l.label.trim(),
                      url: l.url.trim(),
                      sortOrder: i,
                    }))
                  await replaceSocialLinks(payload)
                  setSocialMessage("Links saved.")
                } catch (e) {
                  setSocialMessage(
                    e instanceof ApiError ? e.message : "Could not save links.",
                  )
                } finally {
                  setSocialBusy(false)
                }
              }}
            />
          )}

          {screen === "shipping" && (
            <div className="pt-2 space-y-4">
              <p className="text-sm text-muted-foreground">
                Saved shipping details pre-fill when you buy physical items from creator stores.
              </p>
              <BuyerDetailsForm value={buyerDetails} onChange={setBuyerDetails} disabled={buyerBusy} />
              <Button
                className="w-full rounded-full"
                disabled={buyerBusy}
                onClick={() => {
                  setBuyerBusy(true)
                  setBuyerMessage(null)
                  void updateMe(buyerDetailsToUpdateMeBody(buyerDetails))
                    .then(() => {
                      setBuyerMessage("Details saved.")
                      return onRefreshUser?.()
                    })
                    .catch((e) =>
                      setBuyerMessage(
                        e instanceof ApiError ? e.message : "Could not save details.",
                      ),
                    )
                    .finally(() => setBuyerBusy(false))
                }}
              >
                {buyerBusy ? "Saving…" : "Save details"}
              </Button>
              {buyerMessage && (
                <p className="text-sm text-center text-muted-foreground">{buyerMessage}</p>
              )}
            </div>
          )}

          {screen === "upload" && (
            <UploadPanel
              selected={uploadType}
              title={uploadTitle}
              file={uploadFile}
              progress={uploadProgress}
              error={uploadError}
              uploading={uploading}
              processing={uploadProcessing}
              processingStatus={processingStatus}
              done={uploadDone}
              onSelect={(id) => {
                setUploadType(id)
                setUploadError(null)
                setUploadDone(false)
                setUploadProcessing(false)
                setProcessingStatus(null)
              }}
              onTitleChange={setUploadTitle}
              onFileChange={(f) => {
                setUploadFile(f)
                setUploadError(null)
              }}
              onUpload={async () => {
                if (!uploadType || !uploadTitle.trim() || !uploadFile) return
                const maxBytes = getVideoUploadMaxBytes()
                if (maxBytes && uploadFile.size > maxBytes) {
                  setUploadError(`File exceeds ${Math.round(maxBytes / (1024 * 1024))} MB limit`)
                  return
                }
                setUploading(true)
                setUploadProcessing(false)
                setUploadDone(false)
                setUploadError(null)
                setUploadProgress(0)
                setProcessingStatus(null)
                try {
                  const queued = await uploadVideoFlow(
                    {
                      type: uploadType as "short" | "video",
                      title: uploadTitle.trim(),
                      mimeType: uploadFile.type,
                      fileName: uploadFile.name,
                    },
                    uploadFile,
                    setUploadProgress,
                  )
                  setUploading(false)
                  setUploadProcessing(true)
                  setProcessingStatus("processing")
                  await pollVideoUntilReady(queued.videoId, {
                    onStatus: setProcessingStatus,
                  })
                  setUploadDone(true)
                } catch (e) {
                  const msg =
                    e instanceof ApiError
                      ? e.message
                      : e instanceof Error
                        ? e.message
                        : "Upload failed"
                  setUploadError(msg)
                } finally {
                  setUploading(false)
                  setUploadProcessing(false)
                }
              }}
            />
          )}
        </div>
      </div>

      <VerticalSeriesWizard
        isOpen={verticalWizardOpen}
        initialIntent={verticalWizardIntent}
        onClose={() => {
          setVerticalWizardOpen(false)
          setVerticalWizardIntent(undefined)
        }}
        onSuccess={() => {
          void fetchMyVerticalSeries()
            .then((res) => setMySeries(res.items))
            .catch(() => {})
        }}
      />
    </div>
  )
}

function MenuPanel({
  user,
  isStreamer,
  showCreatorDashboard,
  darkModeEnabled,
  onDarkModeToggle,
  onCoinsClick,
  onNavigate,
  onStreamerApply,
  onLogout,
}: {
  user: User | null
  isStreamer: boolean
  showCreatorDashboard: boolean
  darkModeEnabled: boolean
  onDarkModeToggle: () => void
  onCoinsClick: () => void
  onNavigate: (screen: ProfileSettingsScreen) => void
  onStreamerApply: () => void
  onLogout: () => void
}) {
  const items: {
    icon: typeof Crown
    label: string
    description: string
    screen?: ProfileSettingsScreen
    action?: () => void
    toggle?: boolean
    isEnabled?: boolean
    danger?: boolean
    accent?: "premium" | "live"
  }[] = [
    { icon: Crown, label: "Upgrade to Premium", description: "Ad-free viewing & exclusive perks", screen: "premium", accent: "premium" },
    isStreamer
      ? { icon: Radio, label: "Go Live", description: "Live Studio — camera or OBS", screen: "go-live", accent: "live" }
      : {
          icon: Radio,
          label: "Become a Streamer",
          description: user?.streamerStatus === "pending" ? "Application pending..." : "Apply to start streaming",
          action: onStreamerApply,
          accent: "live",
        },
    { icon: Clock, label: "Watch History", description: "Recently watched content", screen: "history" },
    { icon: Truck, label: "Shipping & checkout", description: "Address for store purchases", screen: "shipping" },
    { icon: ListMusic, label: "Playlists", description: "Create and manage playlists", screen: "playlists" },
    { icon: Link2, label: "Social Links", description: "Links on your creator profile", screen: "social" },
    ...(showCreatorDashboard
      ? [
          {
            icon: BarChart3,
            label: "Performance & Revenue",
            description: "Views, ads on your videos, earnings, impact",
            screen: "dashboard" as const,
          },
        ]
      : []),
    { icon: Bell, label: "Notifications", description: "Email & push preferences", screen: "notifications" },
    {
      icon: Moon,
      label: "Dark Mode",
      description: darkModeEnabled ? "Currently enabled" : "Currently disabled",
      toggle: true,
      isEnabled: darkModeEnabled,
      action: onDarkModeToggle,
    },
    { icon: HelpCircle, label: "Help & Support", description: "FAQs and contact", screen: "help" },
    { icon: LogOut, label: "Sign Out", description: "Log out of your account", action: onLogout, danger: true },
  ]

  return (
    <div className="space-y-2 pt-2 md:pt-3">
      <button
        type="button"
        onClick={onCoinsClick}
        className="w-full flex items-center gap-4 px-4 py-4 md:px-5 md:py-5 rounded-xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors mb-2 md:mb-3"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-xl md:text-2xl">
          🪙
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm md:text-base font-medium">Your Coins</p>
          <p className="text-xs md:text-sm text-muted-foreground">{(user?.coins ?? 0).toLocaleString()} available</p>
        </div>
        <span className="text-sm md:text-base font-semibold text-primary">Top Up</span>
      </button>

      <div className="md:grid md:grid-cols-2 md:gap-x-3 md:gap-y-1">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if (item.toggle && item.action) item.action()
              else if (item.action) item.action()
              else if (item.screen) onNavigate(item.screen)
            }}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3.5 md:px-4 md:py-4 rounded-xl hover:bg-secondary/50 transition-colors text-left",
              item.accent === "premium" && "bg-primary/5",
              item.accent === "live" && "bg-green-500/5",
              item.danger && "md:col-span-2"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center shrink-0",
                item.accent === "premium" && "bg-primary",
                item.accent === "live" && "bg-green-500",
                !item.accent && !item.danger && "bg-secondary",
                item.danger && "bg-destructive/10"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  item.accent ? "text-white" : item.danger ? "text-destructive" : "text-foreground"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm md:text-base font-medium", item.danger && "text-destructive")}>{item.label}</p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">{item.description}</p>
            </div>
            {item.toggle ? (
              <div
                className={cn(
                  "w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors",
                  item.isEnabled ? "bg-primary justify-end" : "bg-muted justify-start"
                )}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </div>
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </button>
        )
      })}
      </div>
    </div>
  )
}

function NotificationsPanel({
  settings,
  loading,
  onToggle,
}: {
  settings: Record<string, boolean>
  loading: boolean
  onToggle: (id: string, enabled: boolean) => void
}) {
  return (
    <div className="space-y-2 md:space-y-3 pt-2 md:pt-3">
      <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
        Choose what you want to be notified about.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading preferences…</p>
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-3">
          {NOTIFICATION_PREFS.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-xl bg-secondary/30"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base">{p.label}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{p.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggle(p.id, !settings[p.id])}
                className={cn(
                  "w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors",
                  settings[p.id] ? "bg-primary justify-end" : "bg-muted justify-start",
                )}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HelpPanel() {
  return (
    <div className="pt-2 md:pt-3 space-y-4 md:space-y-5">
      <p className="text-sm md:text-base text-muted-foreground">Quick answers to common questions.</p>
      <div className="md:grid md:grid-cols-2 md:gap-4">
      {FAQS.map((f) => (
        <div key={f.q} className="p-3 md:p-4 rounded-xl bg-secondary/30 border border-border">
          <p className="font-semibold text-sm md:text-base mb-1">{f.q}</p>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{f.a}</p>
        </div>
      ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 pt-2">
        <a
          href="mailto:support@prysym.tv"
          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50"
        >
          <Mail className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Email Support</p>
            <p className="text-xs text-muted-foreground">support@prysym.tv</p>
          </div>
        </a>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 opacity-70">
          <MessageSquare className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Live Chat</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PremiumPanel({
  membership,
  subscribed,
  busy,
  error,
  onSubscribe,
}: {
  membership: PublicMembershipConfig
  subscribed: boolean
  busy?: boolean
  error?: string | null
  onSubscribe: () => void | Promise<void>
}) {
  const priceLabel = `$${membership.priceUsd.toFixed(2)}/mo`

  if (subscribed) {
    return (
      <div className="py-8 space-y-6">
        <div className="text-center">
          <Check className="w-12 h-12 text-primary mx-auto mb-3" />
          <p className="font-bold text-lg">You&apos;re a member!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ad-free on Shorts, Verticals, and Movies. Channel memberships are separate (support creators on their profile).
          </p>
        </div>
        <ChannelMembershipsPanel />
      </div>
    )
  }

  return (
    <div className="pt-2 md:pt-3 space-y-4 md:space-y-6">
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      <p className="text-sm md:text-base text-muted-foreground text-center">
        One membership — ad-free across Shorts, Verticals, and Movies.
      </p>
      <div className="rounded-xl border border-primary bg-primary/5 p-5 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{membership.label}</span>
          <span className="font-black text-lg">{priceLabel}</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {membership.perks.map((p) => (
            <li key={p} className="text-sm text-muted-foreground flex gap-1.5">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <Button
        onClick={() => void onSubscribe()}
        disabled={busy}
        className="w-full rounded-full h-11 md:h-12 md:text-base"
      >
        {busy ? "Starting checkout…" : `Subscribe — ${priceLabel}`}
      </Button>
      <ChannelMembershipsPanel />
    </div>
  )
}

function ChannelMembershipsPanel() {
  const [items, setItems] = useState<CreatorSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    void fetchMyCreatorSubscriptions()
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground pt-4">Loading memberships…</p>
  }
  if (items.length === 0) return null

  return (
    <div className="pt-4 border-t border-border space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Channel memberships</h3>
      </div>
      <ul className="space-y-2">
        {items.map((sub) => (
          <li key={sub.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {sub.creator?.displayName ?? sub.creator?.username ?? "Creator"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {sub.tier} · {sub.status}
              </p>
            </div>
            {sub.status === "active" ? (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full shrink-0"
                disabled={busyId === sub.id}
                onClick={() => {
                  setBusyId(sub.id)
                  void cancelCreatorSubscription(sub.id)
                    .then(() => setItems((prev) => prev.filter((s) => s.id !== sub.id)))
                    .finally(() => setBusyId(null))
                }}
              >
                Cancel
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SocialLinksPanel({
  links,
  busy,
  message,
  onChange,
  onSave,
}: {
  links: Array<{ label: string; url: string; sortOrder: number }>
  busy: boolean
  message: string | null
  onChange: (links: Array<{ label: string; url: string; sortOrder: number }>) => void
  onSave: () => void | Promise<void>
}) {
  const updateLink = (index: number, field: "label" | "url", value: string) => {
    onChange(links.map((l, i) => (i === index ? { ...l, [field]: value } : l)))
  }

  return (
    <div className="pt-2 space-y-4">
      <p className="text-sm text-muted-foreground">
        These links appear on your public creator profile.
      </p>
      {links.map((link, i) => (
        <div key={i} className="space-y-2 p-3 rounded-xl bg-secondary/30">
          <input
            value={link.label}
            onChange={(e) => updateLink(i, "label", e.target.value)}
            placeholder="Label (e.g. Twitter)"
            className="w-full h-10 px-3 rounded-lg bg-secondary text-sm"
          />
          <input
            value={link.url}
            onChange={(e) => updateLink(i, "url", e.target.value)}
            placeholder="https://"
            className="w-full h-10 px-3 rounded-lg bg-secondary text-sm"
          />
        </div>
      ))}
      <Button
        variant="secondary"
        className="w-full rounded-full"
        onClick={() =>
          onChange([...links, { label: "", url: "", sortOrder: links.length }])
        }
      >
        Add link
      </Button>
      <Button className="w-full rounded-full" disabled={busy} onClick={() => void onSave()}>
        {busy ? "Saving…" : "Save links"}
      </Button>
      {message && <p className="text-sm text-center text-muted-foreground">{message}</p>}
    </div>
  )
}

function HistoryPanel({
  items,
  loading,
  onClear,
  onDelete,
  onOpen,
}: {
  items: SettingsHistoryItem[]
  loading: boolean
  onClear: () => void
  onDelete: (item: SettingsHistoryItem) => void
  onOpen: (href: string) => void
}) {
  return (
    <div className="pt-2">
      <div className="flex justify-end mb-3">
        {items.length > 0 && (
          <button type="button" onClick={onClear} className="text-xs text-destructive flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground py-12 text-sm">Loading history…</p>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">No watch history yet.</p>
      ) : (
        <div className="space-y-2 md:space-y-3 md:grid md:grid-cols-2 md:gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="w-full flex gap-3 p-2 md:p-3 rounded-xl hover:bg-secondary/50 group"
            >
              <button
                type="button"
                onClick={() => onOpen(item.href)}
                className="flex flex-1 gap-3 text-left min-w-0"
              >
                <div className="relative w-28 md:w-36 aspect-video rounded-lg overflow-hidden shrink-0">
                  <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
                <div className="flex-1 py-1 min-w-0">
                  <p className="text-sm md:text-base font-medium line-clamp-2">{item.title}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {item.channel} · {item.progress}%
                  </p>
                </div>
                <Play className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 self-center shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="shrink-0 self-center p-2 text-muted-foreground hover:text-destructive"
                aria-label="Remove from history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VerticalCreatorGatePanel({
  user,
  onApply,
}: {
  user: User | null
  onApply: () => void
}) {
  return (
    <div className="py-8 text-center px-2">
      <Film className="w-10 h-10 text-primary mx-auto mb-3" />
      <p className="font-semibold mb-2">Vertical creator approval required</p>
      <p className="text-sm text-muted-foreground mb-4">
        Apply to create and publish micro-drama series on Prysym TV.
      </p>
      <Button onClick={onApply} className="rounded-full">
        {user?.verticalCreatorStatus === "pending"
          ? "Application pending"
          : user?.verticalCreatorStatus === "rejected"
            ? "Re-apply"
            : "Apply now"}
      </Button>
    </div>
  )
}

function GoLivePanel({
  user,
  isStreamer,
  title,
  category,
  streamKey,
  rtmpUrl,
  copied,
  loading,
  error,
  ingestHealth,
  mode,
  categoryOptions,
  onModeChange,
  onTitleChange,
  onCategoryChange,
  onGenerateKey,
  onCopy,
  onOpenLive,
  onApplyStreamer,
}: {
  user: User | null
  isStreamer: boolean
  title: string
  category: string
  streamKey: string | null
  rtmpUrl: string
  copied: boolean
  loading: boolean
  error: string | null
  ingestHealth: { rtmpReachable: boolean; hint: string } | null
  mode: "camera" | "obs"
  categoryOptions: ContentCategory[]
  onModeChange: (mode: "camera" | "obs") => void
  onTitleChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onGenerateKey: () => void | Promise<void>
  onCopy: () => void
  onOpenLive: () => void
  onApplyStreamer: () => void
}) {
  if (!isStreamer) {
    return (
      <div className="py-8 text-center px-2">
        <Radio className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold mb-2">Streamer approval required</p>
        <p className="text-sm text-muted-foreground mb-4">Apply to broadcast live on Prysym TV.</p>
        <Button onClick={onApplyStreamer} className="rounded-full">
          {user?.streamerStatus === "pending" ? "Application Pending" : "Apply Now"}
        </Button>
      </div>
    )
  }

  return (
    <div className="pt-2 md:pt-3 space-y-4 md:space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Go live from your browser with camera and mic — no extra software required. OBS is optional
        for creators who need scenes, overlays, or professional capture hardware.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onModeChange("camera")}
          className={`rounded-xl border p-3 text-left transition-colors ${
            mode === "camera"
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary/30 hover:bg-secondary/50"
          }`}
        >
          <p className="text-sm font-semibold">Camera &amp; mic</p>
          <p className="text-xs text-muted-foreground mt-1">
            Recommended — one tap to Live Studio in your browser.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("obs")}
          className={`rounded-xl border p-3 text-left transition-colors ${
            mode === "obs"
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary/30 hover:bg-secondary/50"
          }`}
        >
          <p className="text-sm font-semibold">OBS Studio</p>
          <p className="text-xs text-muted-foreground mt-1">
            Optional — multi-source layouts, overlays, and capture cards.
          </p>
        </button>
      </div>

      {ingestHealth && (
        <div
          className={`p-3 rounded-xl text-xs md:text-sm border ${
            ingestHealth.rtmpReachable
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
          }`}
        >
          {ingestHealth.hint}
        </div>
      )}
      <div className="md:grid md:grid-cols-2 md:gap-4">
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Stream title"
        className="w-full h-11 md:h-12 px-4 rounded-xl bg-secondary text-sm md:text-base md:col-span-2"
      />
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full h-11 md:h-12 px-4 rounded-xl bg-secondary text-sm md:text-base md:col-span-2"
      >
        {(categoryOptions.length > 0
          ? categoryOptions
          : [
              { slug: "gaming", label: "Gaming" },
              { slug: "music", label: "Music" },
              { slug: "technology", label: "Technology" },
              { slug: "fitness", label: "Fitness" },
              { slug: "talk", label: "Talk" },
            ]
        ).map((c) => (
          <option key={c.slug} value={c.label}>
            {c.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground md:col-span-2 -mt-2">
        Categories are managed in Admin → Config → Video categories.
      </p>
      </div>
      {mode === "obs" && (
        <div className="p-3 md:p-4 rounded-xl bg-secondary/30 text-xs md:text-sm space-y-1 font-mono break-all">
          <p>
            <span className="text-muted-foreground">Server:</span> {rtmpUrl}
          </p>
          <p>
            <span className="text-muted-foreground">Key:</span> {streamKey ?? "Generate below"}
          </p>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {mode === "obs" && streamKey ? (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCopy} className="flex-1 rounded-full gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy server & key"}
          </Button>
          <Button onClick={onOpenLive} className="flex-1 rounded-full">
            Open Live Studio
          </Button>
        </div>
      ) : mode === "camera" && streamKey ? (
        <Button onClick={onOpenLive} className="w-full rounded-full gap-2">
          <Radio className="w-4 h-4" />
          Open Live Studio
        </Button>
      ) : (
        <Button
          onClick={() => void onGenerateKey()}
          disabled={!title.trim() || loading}
          className="w-full rounded-full gap-2"
        >
          {mode === "camera" ? (
            <Radio className="w-4 h-4" />
          ) : (
            <Key className="w-4 h-4" />
          )}
          {loading
            ? "Opening…"
            : mode === "camera"
              ? "Open Live Studio"
              : "Generate Stream Key"}
        </Button>
      )}
      {mode === "obs" ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          In OBS → Settings → Stream: Service <strong>Custom</strong>, Server = RTMP URL above,
          Stream Key = key above. Keep Live Studio open for chat and gifts — your OBS preview is
          your real-time monitor.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enter a title and open Live Studio to preview your camera and mic. When everything looks
          good, tap <strong>Go Live</strong> in the studio — viewers won&rsquo;t see you until then.
        </p>
      )}
    </div>
  )
}

function UploadPanel({
  selected,
  title,
  file,
  progress,
  error,
  uploading,
  processing,
  processingStatus,
  done,
  onSelect,
  onTitleChange,
  onFileChange,
  onUpload,
}: {
  selected: string | null
  title: string
  file: File | null
  progress: number
  error: string | null
  uploading: boolean
  processing: boolean
  processingStatus: string | null
  done: boolean
  onSelect: (id: string) => void
  onTitleChange: (v: string) => void
  onFileChange: (file: File | null) => void
  onUpload: () => void
}) {
  if (done) {
    return (
      <div className="py-10 text-center">
        <Check className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="font-semibold">Upload complete</p>
        <p className="text-sm text-muted-foreground mt-1">Your video is ready to watch.</p>
      </div>
    )
  }

  if (processing) {
    return (
      <div className="py-10 text-center px-4">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold">Processing video</p>
        <p className="text-sm text-muted-foreground mt-1">
          {processingStatus === "ready"
            ? "Finishing up…"
            : "Transcoding for playback. This may take a few minutes."}
        </p>
        {processingStatus && processingStatus !== "ready" && (
          <p className="text-xs text-muted-foreground mt-2 capitalize">Status: {processingStatus}</p>
        )}
      </div>
    )
  }

  return (
    <div className="pt-2 md:pt-3 space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {UPLOAD_TYPES.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={cn(
                "p-3 md:p-4 rounded-xl border text-left transition-colors",
                selected === t.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/30"
              )}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary mb-1 md:mb-2" />
              <p className="text-sm md:text-base font-semibold">{t.label}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{t.description}</p>
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="md:max-w-2xl md:mx-auto md:space-y-5 space-y-4">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Title"
            className="w-full h-11 md:h-12 px-4 rounded-xl bg-secondary text-sm md:text-base"
          />
          <label className="block w-full border-2 border-dashed border-border rounded-xl p-8 md:p-12 text-center cursor-pointer hover:border-primary/40">
            <input
              type="file"
              className="hidden"
              accept="video/*,audio/*"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            <Upload className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm md:text-base font-medium">
              {file ? file.name : "Click to choose file"}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : "Video or audio"}
            </p>
          </label>
          {uploading && progress > 0 && (
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button
            onClick={onUpload}
            disabled={!title || !file || uploading || processing}
            className="w-full rounded-full md:h-12 md:text-base"
          >
            {uploading ? `Uploading${progress ? ` ${progress}%` : "..."}` : "Start Upload"}
          </Button>
        </div>
      )}
    </div>
  )
}

function PodcastCreatorPanel({
  shows,
  showTitle,
  showCategory,
  categoryOptions,
  episodeShowId,
  episodeTitle,
  audioFile,
  showCoverFile,
  busy,
  message,
  onShowTitleChange,
  onShowCategoryChange,
  onEpisodeShowIdChange,
  onEpisodeTitleChange,
  onAudioFileChange,
  onShowCoverFileChange,
  onCreateShow,
  onUploadEpisode,
}: {
  shows: MyPodcastShow[]
  showTitle: string
  showCategory: string
  categoryOptions: Array<{ slug: string; label: string }>
  episodeShowId: string
  episodeTitle: string
  audioFile: File | null
  showCoverFile: File | null
  busy: boolean
  message: string | null
  onShowTitleChange: (v: string) => void
  onShowCategoryChange: (v: string) => void
  onEpisodeShowIdChange: (v: string) => void
  onEpisodeTitleChange: (v: string) => void
  onAudioFileChange: (f: File | null) => void
  onShowCoverFileChange: (f: File | null) => void
  onCreateShow: () => void | Promise<void>
  onUploadEpisode: () => void | Promise<void>
}) {
  return (
    <div className="pt-2 space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">New show</h3>
        <input
          value={showTitle}
          onChange={(e) => onShowTitleChange(e.target.value)}
          placeholder="Show title"
          className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
        />
        <select
          value={showCategory}
          onChange={(e) => onShowCategoryChange(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
        >
          {categoryOptions.map((c) => (
            <option key={c.slug} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="block p-4 rounded-xl border border-dashed border-border text-center cursor-pointer hover:border-primary/50">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onShowCoverFileChange(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground mb-1">Show cover (optional)</p>
          <p className="text-sm">{showCoverFile?.name ?? "Choose image"}</p>
        </label>
        <Button onClick={() => void onCreateShow()} disabled={busy || !showTitle.trim()} className="w-full rounded-full">
          Create show
        </Button>
      </section>

      {shows.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Upload episode</h3>
          <select
            value={episodeShowId}
            onChange={(e) => onEpisodeShowIdChange(e.target.value)}
            className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
          >
            <option value="">Select show</option>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <input
            value={episodeTitle}
            onChange={(e) => onEpisodeTitleChange(e.target.value)}
            placeholder="Episode title"
            className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
          />
          <label className="block p-6 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary/50">
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac,.webm"
              className="hidden"
              onChange={(e) => onAudioFileChange(e.target.files?.[0] ?? null)}
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">{audioFile?.name ?? "Choose audio file"}</p>
          </label>
          <Button
            onClick={() => void onUploadEpisode()}
            disabled={busy || !episodeShowId || !episodeTitle.trim() || !audioFile}
            className="w-full rounded-full"
          >
            Publish episode
          </Button>
        </section>
      )}

      {shows.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">Your shows</h3>
          <ul className="space-y-2">
            {shows.map((s) => (
              <li key={s.id} className="p-3 rounded-xl bg-secondary/50 text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s._count?.episodes ?? 0} episode{(s._count?.episodes ?? 0) === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {message && <p className="text-sm text-center text-muted-foreground">{message}</p>}
    </div>
  )
}

function PlaylistsManagePanel({
  playlists,
  newTitle,
  busy,
  onNewTitleChange,
  onCreate,
  onDelete,
}: {
  playlists: PlaylistSummary[]
  newTitle: string
  busy: boolean
  onNewTitleChange: (v: string) => void
  onCreate: () => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  return (
    <div className="pt-2 space-y-4">
      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => onNewTitleChange(e.target.value)}
          placeholder="Playlist name"
          className="flex-1 h-11 px-4 rounded-xl bg-secondary text-sm"
        />
        <Button onClick={() => void onCreate()} disabled={busy || !newTitle.trim()} className="rounded-full shrink-0">
          Create
        </Button>
      </div>
      {playlists.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No playlists yet.</p>
      ) : (
        <ul className="space-y-2">
          {playlists.map((p) => (
            <li key={p.id} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50">
              <Link href={`/playlist/${p.id}`} className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.itemCount ?? 0} items</p>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive"
                disabled={busy}
                onClick={() => void onDelete(p.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
