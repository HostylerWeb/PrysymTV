"use client"

import { use, useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  Share2,
  Heart,
  Send,
  Users,
  Gift,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Maximize,
  Lock,
  Flag,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { ReportModal } from "@/components/report-modal"
import { ShareSheet } from "@/components/share-sheet"
import { useAuth } from "@/contexts/auth-context"
import { LiveBroadcastPlayer } from "@/components/live-broadcast-player"
import { CastMediaButton } from "@/components/cast-media-button"
import { LiveStudioPanel } from "@/components/live-studio-panel"
import { fetchGiftCatalog, sendGift } from "@/lib/api/billing"
import { endStream, fetchStream, type StreamDetail } from "@/lib/api/streams"
import {
  fetchPublicProfile,
  followUser,
  unfollowUser,
  toggleCreatorLiveAlerts,
} from "@/lib/api/users"
import { formatEngagementCount } from "@/lib/engagement-count"
import { userAvatarUrl } from "@/lib/user-avatar"
import { connectStreamChat, type StreamChatMessage, type StreamGiftEvent } from "@/lib/api/stream-chat"
import { StreamChatLine, type StreamChatLine as StreamChatLineType } from "@/components/stream-chat-line"
import { giftIconFor } from "@/lib/gift-icons"
import type { Socket } from "socket.io-client"

export default function LiveWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const studioMode = searchParams.get("studio") === "obs" ? "obs" : "camera"
  const [stream, setStream] = useState<StreamDetail | null>(null)
  const [giftCatalog, setGiftCatalog] = useState<
    Array<{ id: string; name: string; cost: number; icon: string }>
  >([])
  const [loadError, setLoadError] = useState(false)
  const { user, isAuthenticated, refreshUser } = useAuth()
  const [chatMessages, setChatMessages] = useState<StreamChatLineType[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [showGiftPanel, setShowGiftPanel] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isNotifyOn, setIsNotifyOn] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isEndingStream, setIsEndingStream] = useState(false)
  const [copiedRtmp, setCopiedRtmp] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const userCoins = user?.coins || 0

  useEffect(() => {
    if (!stream?.streamerSlug || !isAuthenticated) return
    void fetchPublicProfile(stream.streamerSlug)
      .then((p) => {
        setIsFollowing(p.isFollowing ?? false)
        setIsNotifyOn(p.liveAlertsOn ?? false)
        setFollowersCount(p.followersCount ?? 0)
      })
      .catch(() => {})
  }, [stream?.streamerSlug, isAuthenticated])

  useEffect(() => {
    let cancelled = false

    const loadStream = async () => {
      try {
        const s = await fetchStream(id)
        if (!cancelled) {
          setStream((prev) => {
            if (
              prev &&
              prev.hlsPlaybackUrl === s.hlsPlaybackUrl &&
              prev.webrtcPlaybackUrl === s.webrtcPlaybackUrl &&
              prev.status === s.status &&
              prev.id === s.id
            ) {
              return prev
            }
            return s
          })
          setViewerCount(s.viewerCount)
          setLoadError(false)
        }
      } catch {
        if (!cancelled) setLoadError(true)
      }
    }

    void loadStream()
    const poll = setInterval(() => void loadStream(), 3_000)

    void fetchGiftCatalog().then((items) => {
      if (!cancelled && items.length) {
        setGiftCatalog(
          items.map((g) => ({
            id: g.id,
            name: g.name,
            cost: g.coinCost,
            icon: giftIconFor(g.id),
          })),
        )
      }
    })

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [id])

  useEffect(() => {
    const el = liveVideoRef.current
    if (el) el.muted = isMuted
  }, [isMuted, stream?.hlsPlaybackUrl])

  useEffect(() => {
    if (!stream?.id) return
    let cancelled = false
    void connectStreamChat(stream.id)
      .then(({ socket, history }) => {
        if (cancelled) {
          socket.disconnect()
          return
        }
        socketRef.current = socket
        setChatMessages(
          history.map((m) => ({
            id: m.id,
            user: m.user,
            message: m.message,
            color: m.color,
          })),
        )
        socket.on("message", (msg: StreamChatMessage) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              user: msg.user,
              message: msg.message,
              color: msg.color,
              type: "message",
            },
          ])
        })
        socket.on("gift", (gift: StreamGiftEvent) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: gift.id,
              user: gift.user,
              message: "",
              color: gift.color,
              type: "gift",
              giftName: gift.giftName,
              giftIcon: giftIconFor(gift.giftIcon),
              coins: gift.coins,
            },
          ])
        })
        socket.on("viewers", (payload: { count: number }) => {
          if (typeof payload?.count === "number") setViewerCount(payload.count)
        })
        socket.on("streamEnded", () => {
          setStream((prev) =>
            prev
              ? { ...prev, status: "ended", hlsPlaybackUrl: null }
              : prev,
          )
          const el = liveVideoRef.current
          if (el) {
            el.pause()
            el.removeAttribute("src")
            el.load()
          }
        })
      })
      .catch(() => {
        /* chat unavailable — keep empty */
      })
    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [stream?.id])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) setIsAuthModalOpen(true)
    else action()
  }

  const handleSendGift = async (gift: { id: string; name: string; cost: number; icon: string }) => {
    if (userCoins < gift.cost || !stream?.creatorId) return
    try {
      await sendGift({
        giftId: gift.id,
        receiverId: stream.creatorId,
        streamId: stream.id,
      })
      void refreshUser()
    } catch {
      /* keep balance — server did not charge */
    }
    setShowGiftPanel(false)
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-muted-foreground text-center">Stream not found or unavailable.</p>
        <Link href="/">
          <Button variant="secondary" className="rounded-full">
            Back to home
          </Button>
        </Link>
      </main>
    )
  }

  if (!stream) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading stream…</p>
      </main>
    )
  }

  const isOwner =
    isAuthenticated && user?.id != null && stream.creatorId === user.id
  const isLive =
    stream.status === "live" &&
    Boolean(stream.webrtcPlaybackUrl || stream.hlsPlaybackUrl)
  const canEndStream =
    isOwner && (stream.status === "live" || stream.status === "scheduled")

  const handleEndStream = async () => {
    if (!stream || isEndingStream) return
    setIsEndingStream(true)
    try {
      await endStream(stream.id)
      setStream((prev) =>
        prev ? { ...prev, status: "ended", hlsPlaybackUrl: null } : prev,
      )
      const el = liveVideoRef.current
      if (el) {
        el.pause()
        el.removeAttribute("src")
        el.load()
      }
    } catch {
      /* toast optional */
    } finally {
      setIsEndingStream(false)
    }
  }

  const copyObsCredentials = async () => {
    if (!stream.studio) return
    const text = `Server: ${stream.studio.rtmpUrl}\nStream key: ${stream.studio.streamKey}`
    await navigator.clipboard.writeText(text)
    setCopiedRtmp(true)
    setTimeout(() => setCopiedRtmp(false), 2000)
  }

  const togglePlayerFullscreen = () => {
    const el = playerContainerRef.current
    const video = liveVideoRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    void el.requestFullscreen().catch(() => {
      const webkitVideo = video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
      webkitVideo?.webkitEnterFullscreen?.()
    })
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !stream) return
    requireAuth(() => {
      const text = messageInput.trim()
      setMessageInput("")
      socketRef.current?.emit(
        "message",
        { streamId: stream.id, message: text },
        (res: { error?: string }) => {
          if (res?.error) {
            setChatMessages((p) => [
              ...p,
              {
                id: Date.now().toString(),
                user: "You",
                message: text,
                color: "text-primary",
              },
            ])
          }
        },
      )
    })
  }

  if (isOwner && stream.status !== "ended") {
    return (
      <main className="h-[100dvh] bg-background flex flex-col pb-16 md:pb-0 md:pl-20 overflow-hidden">
        <LiveStudioPanel
          stream={stream}
          studio={stream.studio}
          mode={studioMode}
          viewerCount={viewerCount}
          chatMessages={chatMessages}
          messageInput={messageInput}
          onMessageInputChange={setMessageInput}
          onSendMessage={sendMessage}
          isEndingStream={isEndingStream}
          onEndStream={handleEndStream}
          onCopyRtmp={() => void copyObsCredentials()}
          copiedRtmp={copiedRtmp}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    )
  }

  return (
    <main className="h-[100dvh] bg-background flex flex-col pb-16 md:pb-0 md:pl-20 overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full max-w-[1600px] mx-auto lg:px-4 lg:py-4 lg:gap-4">
        {/* Main column: player + stream info */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div
            ref={playerContainerRef}
            className="relative w-full flex-1 min-h-[40vh] aspect-video lg:aspect-auto lg:min-h-[320px] bg-black rounded-none lg:rounded-xl overflow-hidden shrink-0"
          >
            {isLive && (stream.webrtcPlaybackUrl || stream.hlsPlaybackUrl) ? (
              <LiveBroadcastPlayer
                key={stream.webrtcPlaybackUrl ?? stream.hlsPlaybackUrl}
                webrtcUrl={stream.webrtcPlaybackUrl}
                hlsUrl={stream.hlsPlaybackUrl}
                poster={stream.thumbnail}
                className="w-full h-full object-contain bg-black"
                autoPlay
                muted={isMuted}
                videoRef={liveVideoRef}
              />
            ) : (
              <>
                {stream.thumbnail ? (
                  <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-900" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <p className="text-white/90 text-sm md:text-base font-medium px-4 text-center">
                    {stream.status === "ended"
                      ? "This stream has ended"
                      : stream.status === "live"
                        ? "Waiting for broadcast signal…"
                        : "Stream is offline"}
                  </p>
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/50 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3 md:p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href="/">
                  <button
                    type="button"
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                </Link>
                {isLive ? (
                  <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                  </span>
                ) : (
                  <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded">
                    {stream.status === "ended"
                      ? "ENDED"
                      : stream.status === "scheduled"
                        ? "STARTING"
                        : "OFFLINE"}
                  </span>
                )}
                <span className="bg-black/50 backdrop-blur text-white text-xs px-2.5 py-1 rounded flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {viewerCount.toLocaleString()}
                </span>
              </div>
              <div className="flex gap-1.5 md:gap-2">
                <CastMediaButton
                  variant="on-video"
                  className="w-9 h-9 md:w-10 md:h-10 !bg-black/40 backdrop-blur"
                  media={
                    stream.hlsPlaybackUrl
                      ? {
                          title: stream.title,
                          subtitle: stream.streamer,
                          streamUrl: stream.hlsPlaybackUrl,
                          posterUrl: stream.thumbnail ?? undefined,
                          isLive: isLive,
                        }
                      : null
                  }
                  getCurrentTime={() => liveVideoRef.current?.currentTime ?? 0}
                  onCastStarted={() => {
                    const el = liveVideoRef.current
                    if (el && !el.paused) el.pause()
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                >
                  <Flag className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={togglePlayerFullscreen}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 md:px-5 md:py-4 border-b border-border lg:border lg:rounded-xl lg:mt-4 lg:bg-card/30 shrink-0">
            <h1 className="text-base md:text-xl font-semibold line-clamp-2">{stream.title}</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {stream.category} · Started {stream.startedAgo}
            </p>
            <div className="flex items-center justify-between mt-3 md:mt-4 gap-3">
              <Link href={`/creator/${stream.streamerSlug}`} className="flex items-center gap-3 min-w-0">
                <img
                  src={userAvatarUrl(stream.streamerAvatar, stream.streamerSlug)}
                  alt=""
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full ring-2 ring-primary shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-semibold truncate">{stream.streamer}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatEngagementCount(followersCount)} followers
                  </p>
                </div>
              </Link>
              <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                {canEndStream && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full gap-1.5"
                        disabled={isEndingStream}
                      >
                        <Radio className="w-4 h-4" />
                        {isEndingStream ? "Ending…" : "End stream"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End live stream?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Viewers will see that the broadcast has ended. You can start a new
                          stream from Go Live anytime.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => void handleEndStream()}
                        >
                          End stream
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <button
                  type="button"
                  onClick={() =>
                    requireAuth(() => {
                      const slug = stream.streamerSlug
                      void toggleCreatorLiveAlerts(slug)
                        .then((r) => setIsNotifyOn(r.enabled))
                        .catch(() => {})
                    })
                  }
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isNotifyOn ? "bg-primary text-white" : "bg-secondary",
                  )}
                  title={isNotifyOn ? "Live alerts on" : "Notify when live"}
                  aria-label={isNotifyOn ? "Live alerts on" : "Turn on live alerts"}
                >
                  {isNotifyOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </button>
                <Button
                  onClick={() =>
                    requireAuth(() => {
                      const slug = stream.streamerSlug
                      const next = !isFollowing
                      void (next ? followUser(slug) : unfollowUser(slug))
                        .then(() => setIsFollowing(next))
                        .catch(() => setIsFollowing(next))
                    })
                  }
                  className={cn("rounded-full", isFollowing && "bg-secondary text-foreground")}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile-only chat below info */}
          <div className="flex-1 flex flex-col min-h-0 lg:hidden">
            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-[100px]">
              {chatMessages.map((msg) => (
                <StreamChatLine key={msg.id} msg={msg} />
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGiftPanel(true)}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center shrink-0"
                  >
                    <Gift className="w-5 h-5 text-white" />
                  </button>
                  <input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Say something..."
                    className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm min-w-0"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-3 rounded-full bg-secondary flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <Lock className="w-4 h-4" /> Sign in to chat
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop chat sidebar */}
        <aside className="hidden lg:flex flex-col w-full lg:w-[380px] xl:w-[420px] shrink-0 border border-border rounded-xl bg-card/20 min-h-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">Live chat</div>
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
            {chatMessages.map((msg) => (
              <StreamChatLine key={msg.id} msg={msg} />
            ))}
          </div>
          <div className="p-4 border-t border-border">
            {isAuthenticated ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGiftPanel(true)}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center"
                >
                  <Gift className="w-5 h-5 text-white" />
                </button>
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Say something..."
                  className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-3 rounded-full bg-secondary flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Lock className="w-4 h-4" /> Sign in to chat
              </button>
            )}
          </div>
        </aside>
      </div>

      {showGiftPanel && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowGiftPanel(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-[450px] bg-background rounded-t-3xl md:rounded-3xl p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-lg">Send a Gift</h3>
              <span>🪙 {userCoins.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {giftCatalog.map((gift) => (
                <button
                  key={gift.id}
                  type="button"
                  onClick={() => void handleSendGift(gift)}
                  disabled={userCoins < gift.cost}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-xl bg-secondary",
                    userCoins < gift.cost && "opacity-50",
                  )}
                >
                  <span className="text-3xl">{gift.icon}</span>
                  <span className="text-sm font-medium">{gift.name}</span>
                  <span className="text-xs">🪙 {gift.cost}</span>
                </button>
              ))}
            </div>
            <Link href="/profile">
              <Button variant="secondary" className="w-full rounded-full mt-4">
                Get More Coins
              </Button>
            </Link>
          </div>
        </div>
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="stream"
        targetId={stream.id}
        targetLabel={stream.title}
      />
      <ShareSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title={stream.title} />
    </main>
  )
}
