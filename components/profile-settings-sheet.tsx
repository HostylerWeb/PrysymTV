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
  Eye,
  TrendingUp,
  DollarSign,
  Trash2,
  Play,
  Copy,
  Key,
  Upload,
  Film,
  Headphones,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { User } from "@/contexts/auth-context"
import { mockVideos, mockMovies } from "@/lib/mock-data"
import { uploadVideoFlow, getVideoUploadMaxBytes } from "@/lib/api/videos"
import {
  attachVerticalEpisodeVideo,
  createVerticalEpisode,
  createVerticalSeries,
  fetchMyVerticalSeries,
} from "@/lib/api/verticals-admin"
import { ApiError } from "@/lib/api-client"
import { fetchCreatorDashboard, type CreatorDashboardResponse } from "@/lib/api/analytics"
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

const NOTIFICATION_PREFS = [
  { id: "follow", label: "New followers", description: "When someone follows you" },
  { id: "like", label: "Likes", description: "When someone likes your content" },
  { id: "comment", label: "Comments & replies", description: "Comment activity on your videos" },
  { id: "live", label: "Live alerts", description: "When creators you follow go live" },
  { id: "upload", label: "New uploads", description: "When subscribed creators post" },
  { id: "gift", label: "Gifts received", description: "When you receive a gift on stream" },
  { id: "system", label: "System updates", description: "Platform news and milestones" },
]

const FAQS = [
  { q: "How do I upload a video?", a: "Open Settings → Your Videos → Upload and pick a content type." },
  { q: "How do I become a streamer?", a: "Apply from Settings → Become a Streamer. Once approved, use Go Live." },
  { q: "What are Coins?", a: "Coins let you send gifts during live streams and support creators." },
  { q: "How do I report content?", a: "Use the flag icon on any video, movie, or live stream page." },
]

const PREMIUM_TIERS = [
  { id: "basic", name: "Basic", price: "$2.99/mo", perks: ["Ad-free on one creator", "Subscriber badge in chat"] },
  { id: "premium", name: "Premium", price: "$4.99/mo", perks: ["Ad-free platform-wide", "Skip movie preroll ads", "Exclusive badge", "Early access content"], popular: true },
  { id: "ultimate", name: "Ultimate", price: "$9.99/mo", perks: ["Everything in Premium", "Subscriber-only streams", "Priority support"] },
]

const UPLOAD_TYPES = [
  { id: "short", label: "Short", icon: Video, description: "Vertical short-form (under 60s)" },
  { id: "video", label: "Video", icon: Video, description: "Long-form video" },
  { id: "movie", label: "Movie", icon: Film, description: "Full-length movie" },
  { id: "podcast", label: "Podcast", icon: Headphones, description: "Audio episode" },
]

const HISTORY_ITEMS = [
  ...mockVideos.filter((v) => v.progress).map((v) => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail,
    channel: v.channel,
    progress: v.progress!,
    href: `/watch/${v.id}`,
  })),
  {
    id: "m1",
    title: mockMovies[0].title,
    thumbnail: mockMovies[0].poster,
    channel: "Movie",
    progress: 30,
    href: `/movie/${mockMovies[0].id}`,
  },
]

/** Desktop-optimized sheet sizing (md+). */
const SHEET_SHELL =
  "absolute bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 bg-background rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 max-h-[88vh] md:max-h-[min(820px,90vh)] md:border md:border-border/80"
const SHEET_SIZE_MENU =
  "md:w-[min(600px,92vw)] lg:w-[640px] md:h-[90vh] md:max-h-[92vh] md:min-h-[90vh]"
const SHEET_SIZE_PANEL = "md:w-[min(700px,94vw)] lg:w-[760px] md:min-h-[min(580px,82vh)]"
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
}

interface ProfileSettingsSheetProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  darkModeEnabled: boolean
  onDarkModeToggle: () => void
  onCoinsClick: () => void
  onStreamerApply: () => void
  onLogout: () => void
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
  onLogout,
  initialScreen,
}: ProfileSettingsSheetProps) {
  const router = useRouter()
  const [screen, setScreen] = useState<ProfileSettingsScreen>("menu")
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map((p) => [p.id, true]))
  )
  const [premiumTier, setPremiumTier] = useState("premium")
  const [premiumActive, setPremiumActive] = useState(false)
  const [historyItems, setHistoryItems] = useState(HISTORY_ITEMS)
  const [streamKey, setStreamKey] = useState<string | null>(null)
  const [streamTitle, setStreamTitle] = useState("")
  const [streamCategory, setStreamCategory] = useState("Gaming")
  const [copied, setCopied] = useState(false)
  const [uploadType, setUploadType] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [verticalSlug, setVerticalSlug] = useState("")
  const [verticalTitle, setVerticalTitle] = useState("")
  const [episodeSeriesSlug, setEpisodeSeriesSlug] = useState("")
  const [episodeNumber, setEpisodeNumber] = useState(1)
  const [episodeTitle, setEpisodeTitle] = useState("")
  const [lastEpisodeId, setLastEpisodeId] = useState<string | null>(null)
  const [episodeVideoFile, setEpisodeVideoFile] = useState<File | null>(null)
  const [verticalBusy, setVerticalBusy] = useState(false)
  const [verticalMessage, setVerticalMessage] = useState<string | null>(null)
  const [mySeries, setMySeries] = useState<
    Array<{
      id: string
      slug: string
      title: string
      episodes: Array<{ id: string; episodeNumber: number; title: string }>
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

  if (!isOpen) return null

  const goTo = (next: ProfileSettingsScreen) => setScreen(next)
  const goBack = () => setScreen("menu")

  const handleClose = () => {
    setScreen("menu")
    onClose()
  }

  const isStreamer = user?.isStreamer || user?.streamerStatus === "approved"

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={cn(
          SHEET_SHELL,
          screen === "menu" ? SHEET_SIZE_MENU : SHEET_SIZE_PANEL
        )}
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
            <NotificationsPanel settings={notifSettings} onChange={setNotifSettings} />
          )}

          {screen === "dashboard" && <PerformanceDashboardPanel />}

          {screen === "help" && <HelpPanel />}

          {screen === "premium" && (
            <PremiumPanel
              selected={premiumTier}
              onSelect={setPremiumTier}
              subscribed={premiumActive}
              onSubscribe={() => setPremiumActive(true)}
            />
          )}

          {screen === "history" && (
            <HistoryPanel
              items={historyItems}
              onClear={() => setHistoryItems([])}
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
              copied={copied}
              onTitleChange={setStreamTitle}
              onCategoryChange={setStreamCategory}
              onGenerateKey={() => setStreamKey(`prysym_live_${Date.now().toString(36)}`)}
              onCopy={async () => {
                if (!streamKey) return
                await navigator.clipboard.writeText(streamKey)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              onOpenLive={() => {
                handleClose()
                router.push(`/live/${user?.username?.replace("@", "") ?? "me"}`)
              }}
              onApplyStreamer={() => {
                handleClose()
                onStreamerApply()
              }}
            />
          )}

          {screen === "verticals" && (
            <VerticalSeriesPanel
              mySeries={mySeries}
              verticalSlug={verticalSlug}
              verticalTitle={verticalTitle}
              episodeSeriesSlug={episodeSeriesSlug}
              episodeNumber={episodeNumber}
              episodeTitle={episodeTitle}
              lastEpisodeId={lastEpisodeId}
              episodeVideoFile={episodeVideoFile}
              busy={verticalBusy}
              message={verticalMessage}
              onSlugChange={setVerticalSlug}
              onTitleChange={setVerticalTitle}
              onEpisodeSeriesSlugChange={setEpisodeSeriesSlug}
              onEpisodeNumberChange={setEpisodeNumber}
              onEpisodeTitleChange={setEpisodeTitle}
              onEpisodeVideoFileChange={setEpisodeVideoFile}
              onCreateSeries={async () => {
                if (!verticalSlug.trim() || !verticalTitle.trim()) return
                setVerticalBusy(true)
                setVerticalMessage(null)
                try {
                  await createVerticalSeries({
                    slug: verticalSlug.trim().toLowerCase().replace(/\s+/g, "-"),
                    title: verticalTitle.trim(),
                  })
                  setVerticalMessage("Series created.")
                  const res = await fetchMyVerticalSeries()
                  setMySeries(res.items)
                } catch (e) {
                  setVerticalMessage(e instanceof Error ? e.message : "Failed to create series")
                } finally {
                  setVerticalBusy(false)
                }
              }}
              onCreateEpisode={async () => {
                if (!episodeSeriesSlug.trim() || !episodeTitle.trim()) return
                setVerticalBusy(true)
                setVerticalMessage(null)
                try {
                  const ep = await createVerticalEpisode(episodeSeriesSlug.trim(), {
                    episodeNumber,
                    title: episodeTitle.trim(),
                  }) as { id: string }
                  setLastEpisodeId(ep.id)
                  setVerticalMessage(`Episode ${episodeNumber} created. Upload video below.`)
                  const res = await fetchMyVerticalSeries()
                  setMySeries(res.items)
                } catch (e) {
                  setVerticalMessage(e instanceof Error ? e.message : "Failed to create episode")
                } finally {
                  setVerticalBusy(false)
                }
              }}
              onAttachVideo={async () => {
                if (!lastEpisodeId || !episodeVideoFile) return
                setVerticalBusy(true)
                setVerticalMessage(null)
                try {
                  const done = await uploadVideoFlow(
                    {
                      type: "video",
                      title: episodeTitle.trim() || `Episode ${episodeNumber}`,
                      mimeType: episodeVideoFile.type,
                      fileName: episodeVideoFile.name,
                    },
                    episodeVideoFile,
                  )
                  await attachVerticalEpisodeVideo(lastEpisodeId, done.videoId)
                  setVerticalMessage("Episode video attached.")
                  setEpisodeVideoFile(null)
                } catch (e) {
                  setVerticalMessage(e instanceof Error ? e.message : "Upload or attach failed")
                } finally {
                  setVerticalBusy(false)
                }
              }}
            />
          )}

          {screen === "upload" && (
            <UploadPanel
              selected={uploadType}
              title={uploadTitle}
              file={uploadFile}
              progress={uploadProgress}
              error={uploadError}
              uploading={uploading}
              done={uploadDone}
              onSelect={(id) => {
                setUploadType(id)
                setUploadError(null)
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
                setUploadError(null)
                setUploadProgress(0)
                try {
                  await uploadVideoFlow(
                    {
                      type: uploadType as "short" | "video" | "movie" | "podcast",
                      title: uploadTitle.trim(),
                      mimeType: uploadFile.type,
                      fileName: uploadFile.name,
                    },
                    uploadFile,
                    setUploadProgress,
                  )
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
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function MenuPanel({
  user,
  isStreamer,
  darkModeEnabled,
  onDarkModeToggle,
  onCoinsClick,
  onNavigate,
  onStreamerApply,
  onLogout,
}: {
  user: User | null
  isStreamer: boolean
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
      ? { icon: Radio, label: "Go Live", description: "Stream key & OBS setup", screen: "go-live", accent: "live" }
      : {
          icon: Radio,
          label: "Become a Streamer",
          description: user?.streamerStatus === "pending" ? "Application pending..." : "Apply to start streaming",
          action: onStreamerApply,
          accent: "live",
        },
    { icon: Clock, label: "Watch History", description: "Recently watched content", screen: "history" },
    { icon: Video, label: "Your Videos", description: "Upload shorts, videos, movies", screen: "upload" },
    { icon: Film, label: "Micro-dramas", description: "Create vertical series & episodes", screen: "verticals" },
    {
      icon: BarChart3,
      label: "Performance & Revenue",
      description: "Views, ads on your videos, earnings, impact",
      screen: "dashboard",
    },
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
  onChange,
}: {
  settings: Record<string, boolean>
  onChange: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  return (
    <div className="space-y-2 md:space-y-3 pt-2 md:pt-3">
      <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">Choose what you want to be notified about.</p>
      <div className="md:grid md:grid-cols-2 md:gap-3">
      {NOTIFICATION_PREFS.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 p-3 md:p-4 rounded-xl bg-secondary/30">
          <div className="min-w-0">
            <p className="font-medium text-sm md:text-base">{p.label}</p>
            <p className="text-xs md:text-sm text-muted-foreground">{p.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange((s) => ({ ...s, [p.id]: !s[p.id] }))}
            className={cn(
              "w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors",
              settings[p.id] ? "bg-primary justify-end" : "bg-muted justify-start"
            )}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      ))}
      </div>
    </div>
  )
}

function PerformanceDashboardPanel() {
  const [data, setData] = useState<CreatorDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const dash = await fetchCreatorDashboard()
        if (!cancelled) setData(dash)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Could not load performance data")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground pt-4">Loading your metrics…</p>
  }
  if (error) {
    return <p className="text-sm text-destructive pt-4">{error}</p>
  }
  if (!data) return null

  const fmtUsd = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"
  }

  const perfStats = [
    { label: "Views (24h)", value: formatViewCount(data.performance.views24h), icon: Eye },
    { label: "Views (7d)", value: formatViewCount(data.performance.views7d), icon: TrendingUp },
    { label: "Watch hrs (30d)", value: String(data.performance.watchHours30d), icon: BarChart3 },
    { label: "Earnings (30d)", value: fmtUsd(data.financial.earnings30dUsd), icon: DollarSign },
  ]

  const adStats = [
    { label: "Ad views on your content (24h)", value: formatViewCount(data.advertising.adImpressionsOnYourContent24h) },
    { label: "Ad views (30d)", value: formatViewCount(data.advertising.adImpressionsOnYourContent30d) },
    { label: "Ad clicks (30d)", value: formatViewCount(data.advertising.adClicksOnYourContent30d) },
    { label: "CTR (30d)", value: `${data.advertising.ctr30d}%` },
  ]

  return (
    <div className="pt-2 md:pt-3 space-y-6 md:space-y-8">
      {data.programVerticals.length > 0 && (
        <p className="text-xs md:text-sm text-muted-foreground">
          Programs: {data.programVerticals.join(", ").replace(/_/g, " ")} · Partner tier: {data.partnerTier}
        </p>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2">Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {perfStats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="p-3 md:p-4 rounded-xl bg-secondary/30 border border-border">
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold">{s.value}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{s.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Ads on your videos</h3>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {adStats.map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-secondary/20 border border-border text-sm">
              <p className="font-bold">{s.value}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-6">
        <div>
          <h3 className="text-sm md:text-base font-semibold mb-2 md:mb-3">Top content</h3>
          <div className="space-y-2 md:space-y-2.5">
            {data.topContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Upload videos to see stats here.</p>
            ) : (
              data.topContent.map((item, i) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm md:text-base p-2.5 md:p-3 rounded-lg bg-secondary/20 gap-2"
                >
                  <span className="line-clamp-1">
                    #{i + 1} {item.title}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs md:text-sm">
                    {formatViewCount(item.viewsCount)} views · {item.adImpressions30d} ads
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 md:p-6 rounded-xl border border-border bg-secondary/20">
            <p className="text-sm font-semibold">Revenue (30d)</p>
            <ul className="text-xs md:text-sm text-muted-foreground mt-2 space-y-1">
              <li>Total earnings: {fmtUsd(data.financial.earnings30dUsd)}</li>
              <li>Ad revenue: {fmtUsd(data.financial.adRevenueUsd)}</li>
              <li>Sponsorships: {fmtUsd(data.financial.sponsorshipRevenueUsd)}</li>
              <li>Merch: {fmtUsd(data.financial.merchandiseRevenueUsd)}</li>
              <li>Donations: {fmtUsd(data.financial.donationsUsd)}</li>
            </ul>
          </div>
          <div className="p-4 md:p-6 rounded-xl border border-border bg-secondary/20">
            <p className="text-sm font-semibold">Pending payout</p>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {fmtUsd(data.financial.pendingPayoutUsd)}
            </p>
            <p className="text-xs text-muted-foreground mb-3">Minimum $50 · payout request coming soon</p>
          </div>
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
            <p className="text-sm font-semibold">Community impact</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.communityImpact.jobsSupported} jobs · {data.communityImpact.businessesFunded} businesses ·{" "}
              {fmtUsd(data.communityImpact.dollarsInvested)} invested
            </p>
          </div>
        </div>
      </div>
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
  selected,
  onSelect,
  subscribed,
  onSubscribe,
}: {
  selected: string
  onSelect: (id: string) => void
  subscribed: boolean
  onSubscribe: () => void
}) {
  if (subscribed) {
    return (
      <div className="py-8 text-center">
        <Check className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="font-bold text-lg">You&apos;re Premium!</p>
        <p className="text-sm text-muted-foreground mt-1">Ad-free across Prysym TV.</p>
      </div>
    )
  }

  return (
    <div className="pt-2 md:pt-3 space-y-4 md:space-y-6">
      <p className="text-sm md:text-base text-muted-foreground text-center">Ad-free viewing and exclusive perks.</p>
      <div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
        {PREMIUM_TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "w-full p-4 md:p-5 rounded-xl border text-left transition-all h-full",
              selected === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold md:text-lg">{t.name}</span>
              <span className="font-black md:text-lg">{t.price}</span>
            </div>
            {t.popular && <span className="text-[10px] md:text-xs font-bold text-primary uppercase">Most popular</span>}
            <ul className="mt-2 md:mt-3 space-y-1 md:space-y-1.5">
              {t.perks.map((p) => (
                <li key={p} className="text-xs md:text-sm text-muted-foreground flex gap-1.5">
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <Button onClick={onSubscribe} className="w-full rounded-full h-11 md:h-12 md:text-base">
        Subscribe (mock)
      </Button>
    </div>
  )
}

function HistoryPanel({
  items,
  onClear,
  onOpen,
}: {
  items: typeof HISTORY_ITEMS
  onClear: () => void
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
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">No watch history yet.</p>
      ) : (
        <div className="space-y-2 md:space-y-3 md:grid md:grid-cols-2 md:gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.href)}
              className="w-full flex gap-3 p-2 md:p-3 rounded-xl hover:bg-secondary/50 text-left group"
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
          ))}
        </div>
      )}
    </div>
  )
}

function GoLivePanel({
  user,
  isStreamer,
  title,
  category,
  streamKey,
  copied,
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
  copied: boolean
  onTitleChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onGenerateKey: () => void
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
    <div className="pt-2 md:pt-3 space-y-4 md:space-y-5 md:max-w-xl">
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
        {["Gaming", "Music", "Technology", "Fitness", "Talk"].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      </div>
      <div className="p-3 md:p-4 rounded-xl bg-secondary/30 text-xs md:text-sm space-y-1 font-mono break-all">
        <p>
          <span className="text-muted-foreground">Server:</span> rtmp://live.prysym.tv/app
        </p>
        <p>
          <span className="text-muted-foreground">Key:</span> {streamKey ?? "Generate below"}
        </p>
      </div>
      {streamKey ? (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCopy} className="flex-1 rounded-full gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Key"}
          </Button>
          <Button onClick={onOpenLive} className="flex-1 rounded-full">
            Open Live Page
          </Button>
        </div>
      ) : (
        <Button onClick={onGenerateKey} disabled={!title} className="w-full rounded-full gap-2">
          <Key className="w-4 h-4" /> Generate Stream Key
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Paste the server and key into OBS → Settings → Stream.</p>
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
        <p className="font-semibold">Upload queued</p>
        <p className="text-sm text-muted-foreground mt-1">Processing will finish shortly.</p>
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
            disabled={!title || !file || uploading}
            className="w-full rounded-full md:h-12 md:text-base"
          >
            {uploading ? `Uploading${progress ? ` ${progress}%` : "..."}` : "Start Upload"}
          </Button>
        </div>
      )}
    </div>
  )
}

function VerticalSeriesPanel({
  mySeries,
  verticalSlug,
  verticalTitle,
  episodeSeriesSlug,
  episodeNumber,
  episodeTitle,
  lastEpisodeId,
  episodeVideoFile,
  busy,
  message,
  onSlugChange,
  onTitleChange,
  onEpisodeSeriesSlugChange,
  onEpisodeNumberChange,
  onEpisodeTitleChange,
  onEpisodeVideoFileChange,
  onCreateSeries,
  onCreateEpisode,
  onAttachVideo,
}: {
  mySeries: Array<{
    id: string
    slug: string
    title: string
    episodes: Array<{ id: string; episodeNumber: number; title: string }>
  }>
  verticalSlug: string
  verticalTitle: string
  episodeSeriesSlug: string
  episodeNumber: number
  episodeTitle: string
  lastEpisodeId: string | null
  episodeVideoFile: File | null
  busy: boolean
  message: string | null
  onSlugChange: (v: string) => void
  onTitleChange: (v: string) => void
  onEpisodeSeriesSlugChange: (v: string) => void
  onEpisodeNumberChange: (n: number) => void
  onEpisodeTitleChange: (v: string) => void
  onEpisodeVideoFileChange: (f: File | null) => void
  onCreateSeries: () => void
  onCreateEpisode: () => void
  onAttachVideo: () => void
}) {
  return (
    <div className="space-y-6 pt-2">
      {message && (
        <p className="text-sm text-center text-muted-foreground bg-secondary/40 rounded-lg py-2 px-3">
          {message}
        </p>
      )}

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Your series</h4>
        {mySeries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No micro-drama series yet.</p>
        ) : (
          <ul className="space-y-2">
            {mySeries.map((s) => (
              <li key={s.id} className="p-3 rounded-xl bg-secondary/30 text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">/{s.slug} · {s.episodes.length} episodes</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <h4 className="text-sm font-semibold">New series</h4>
        <input
          value={verticalSlug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="slug (e.g. midnight-contract)"
          className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
        />
        <input
          value={verticalTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Series title"
          className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
        />
        <Button onClick={onCreateSeries} disabled={busy} className="w-full rounded-full">
          Create series
        </Button>
      </section>

      <section className="space-y-3 border-t border-border pt-4">
        <h4 className="text-sm font-semibold">Add episode</h4>
        <input
          value={episodeSeriesSlug}
          onChange={(e) => onEpisodeSeriesSlugChange(e.target.value)}
          placeholder="Series slug"
          className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
        />
        <input
          type="number"
          min={1}
          value={episodeNumber}
          onChange={(e) => onEpisodeNumberChange(Number(e.target.value) || 1)}
          className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
        />
        <input
          value={episodeTitle}
          onChange={(e) => onEpisodeTitleChange(e.target.value)}
          placeholder="Episode title"
          className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
        />
        <Button onClick={onCreateEpisode} disabled={busy} className="w-full rounded-full">
          Create episode
        </Button>
      </section>

      {lastEpisodeId && (
        <section className="space-y-3 border-t border-border pt-4">
          <h4 className="text-sm font-semibold">Attach episode video</h4>
          <p className="text-xs text-muted-foreground">Episode ID: {lastEpisodeId}</p>
          <label className="block p-6 rounded-xl border-2 border-dashed border-border text-center cursor-pointer hover:border-primary/50">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onEpisodeVideoFileChange(e.target.files?.[0] ?? null)}
            />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">{episodeVideoFile?.name ?? "Choose video file"}</p>
          </label>
          <Button
            onClick={onAttachVideo}
            disabled={busy || !episodeVideoFile}
            className="w-full rounded-full"
          >
            Upload & attach
          </Button>
        </section>
      )}
    </div>
  )
}
