"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Music2,
  MoreVertical,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Gift,
  Search,
} from "lucide-react"
import { GiftSheet } from "@/components/gift-sheet"
import { ShortsPageSkeleton } from "@/components/content-skeletons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { notify } from "@/lib/site-notifications"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { useConfirm } from "@/contexts/confirm-context"

import { AdInterstitial } from "@/components/ad-interstitial"
import { fetchServedAd, isValidServedAd, type ServedAd } from "@/lib/api/ads"
import { usePublicAdsConfig } from "@/lib/hooks/use-public-ads-config"
import { useWatchAnalytics } from "@/lib/hooks/use-watch-analytics"
import { ShareSheet } from "@/components/share-sheet"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import {
  fetchShortsFeed,
  fetchVideo,
  recordVideoView,
  toggleVideoLike,
  toggleVideoSave,
  type ShortVideoCard,
} from "@/lib/api/videos-feed"
import { saveWatchProgress } from "@/lib/api/history"
import {
  fetchVideoComments,
  normalizeVideoComment,
  deleteVideoComment,
  postVideoComment,
  toggleCommentLike as apiToggleCommentLike,
  type VideoComment,
} from "@/lib/api/comments"
import { followUser, unfollowUser } from "@/lib/api/users"
import { ReportModal } from "@/components/report-modal"
import { ApiError } from "@/lib/api-client"
import { RelativeTime } from "@/components/relative-time"
import { formatViewCount } from "@/lib/format-media"
import { userAvatarUrl } from "@/lib/user-avatar"
import {
  adjustEngagement,
  engagementFromShort,
  formatEngagementCount,
  type EngagementCounts,
} from "@/lib/engagement-count"
import { CreateFlowModals, triggerContextualCreate } from "@/components/create-flow-modals"
import { CreateHeaderButton } from "@/components/create-header-button"
import { useCreateFlow } from "@/hooks/use-create-flow"
import { useRouter, useSearchParams } from "next/navigation"
export type ShortItem = {
  id: string
  creatorId: string
  videoUrl: string
  username: string
  userSlug: string
  userAvatar: string
  caption: string
  likes: string
  comments: string
  shares: string
  saves: string
  music: string
  isFollowing: boolean
}

function mapShortFromApi(card: ShortVideoCard): ShortItem {
  return {
    id: card.id,
    creatorId: card.creatorId,
    videoUrl: card.playbackUrl ?? card.videoUrl ?? "",
    username: `@${card.channelSlug}`,
    userSlug: card.channelSlug,
    userAvatar: userAvatarUrl(null, card.channelSlug),
    caption: card.title,
    likes: formatViewCount(card.likesCount ?? 0),
    comments: formatViewCount(card.commentsCount ?? 0),
    shares: formatViewCount(card.sharesCount ?? 0),
    saves: "0",
    music: `Original Sound - ${card.channelSlug}`,
    isFollowing: card.isFollowing ?? false,
  }
}

function mapShortFromVideoDetail(
  v: Awaited<ReturnType<typeof fetchVideo>>,
): ShortItem {
  const slug = v.creator.username
  return {
    id: v.id,
    creatorId: v.creator.id,
    videoUrl: v.playbackUrl ?? v.videoUrl ?? v.hlsMasterUrl ?? "",
    username: `@${slug}`,
    userSlug: slug,
    userAvatar: userAvatarUrl(v.creator.avatarUrl, slug),
    caption: v.title,
    likes: formatViewCount(v.likesCount ?? 0),
    comments: formatViewCount(v.commentsCount ?? 0),
    shares: "0",
    saves: "0",
    music: `Original Sound - ${slug}`,
    isFollowing: v.isFollowing ?? false,
  }
}

interface ShortVideoProps {
  short: ShortItem
  counts: EngagementCounts
  isActive: boolean
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onSave: () => void
  onFollow: () => void
  onReport: () => void
  onGift: () => void
  isLiked: boolean
  isSaved: boolean
  isFollowing: boolean
  isSelf: boolean
  isAuthenticated: boolean
  onAuthRequired: () => void
  onUpload?: () => void
  onSearch?: () => void
}

function ShortVideo({
  short,
  counts,
  isActive,
  onLike,
  onComment, 
  onShare, 
  onSave, 
  onFollow,
  onReport,
  onGift,
  isLiked,
  isSaved,
  isFollowing,
  isSelf,
  isAuthenticated,
  onAuthRequired,
  onUpload,
  onSearch,
}: ShortVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.muted = isMuted
        videoRef.current.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true
            setIsMuted(true)
            void videoRef.current.play().catch(() => {})
          }
        })
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setIsPlaying(false)
      }
    }
  }, [isActive, isMuted])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
    setShowControls(true)
    setTimeout(() => setShowControls(false), 1500)
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleAction = (action: () => void) => {
    if (!isAuthenticated) {
      onAuthRequired()
    } else {
      action()
    }
  }

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always flex items-center justify-center">
      {/* Video */}
      <HlsVideoPlayer
        src={short.videoUrl}
        className="w-full h-full object-contain"
        controls={false}
        muted={isMuted}
        playsInline
        loop
        videoRef={videoRef}
      />
      <button type="button" className="absolute inset-0 z-[1]" onClick={togglePlay} aria-label="Toggle play" />

      {/* Play/Pause Indicator */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center animate-in fade-in zoom-in duration-200">
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white fill-white" />
            ) : (
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 pointer-events-none">
        <h1 className="text-lg font-bold text-white">Shorts</h1>
        <div className="flex items-center gap-1 pointer-events-auto">
          {onUpload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onUpload()
              }}
              className="p-2 relative z-20"
              aria-label="Upload short"
              title="Upload short"
            >
              <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 relative z-20"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 md:w-6 md:h-6 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            )}
          </button>
          <button
            type="button"
            onClick={onReport}
            className="p-2 relative z-20"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
          {onSearch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSearch()
              }}
              className="p-2 relative z-20"
              aria-label="Search"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Right Side Actions — centered vertically in the space above mobile bottom nav */}
      <div className="absolute right-2 md:right-3 top-14 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-8 z-20 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-2 md:gap-5 pointer-events-auto">
        {/* Profile */}
        <div className="flex flex-col items-center gap-1">
          <Link href={`/creator/${short.userSlug}`}>
            <div className="relative">
              <img
                src={short.userAvatar}
                alt={short.username}
                className="w-9 h-9 md:w-12 md:h-12 rounded-full border-2 border-white object-cover"
              />
              {!isFollowing && !isSelf && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAction(onFollow)
                  }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary flex items-center justify-center z-10"
                  aria-label={`Follow ${short.username}`}
                >
                  <span className="text-white text-lg leading-none">+</span>
                </button>
              )}
            </div>
          </Link>
        </div>

        {/* Like */}
        <button 
          onClick={() => handleAction(onLike)}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center",
            isLiked && "bg-primary/20"
          )}>
            <Heart className={cn(
              "w-5 h-5 md:w-7 md:h-7 text-white transition-all",
              isLiked && "fill-primary text-primary scale-110"
            )} />
          </div>
          <span className="text-white text-xs font-medium">{formatEngagementCount(counts.likes)}</span>
        </button>

        {/* Comment */}
        <button 
          onClick={() => handleAction(onComment)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatEngagementCount(counts.comments)}</span>
        </button>

        {/* Save/Bookmark */}
        <button 
          onClick={() => handleAction(onSave)}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center",
            isSaved && "bg-yellow-500/20"
          )}>
            <Bookmark className={cn(
              "w-5 h-5 md:w-7 md:h-7 text-white transition-all",
              isSaved && "fill-yellow-500 text-yellow-500"
            )} />
          </div>
          <span className="text-white text-xs font-medium">{formatEngagementCount(counts.saves)}</span>
        </button>

        {/* Gift */}
        <button
          onClick={() => handleAction(onGift)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Gift className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <span className="text-white text-[10px] md:text-xs font-medium">Gift</span>
        </button>

        {/* Share */}
        <button 
          onClick={onShare}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatEngagementCount(counts.shares)}</span>
        </button>

        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute left-0 right-14 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] p-4 z-20">
        <Link href={`/creator/${short.username.replace('@', '')}`}>
          <h3 className="text-white font-bold text-base mb-1">{short.username}</h3>
        </Link>
        <p className="text-white/90 text-sm line-clamp-2 mb-3">{short.caption}</p>
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-white" />
          <div className="overflow-hidden">
            <p className="text-white/80 text-xs whitespace-nowrap animate-marquee">
              {short.music}
            </p>
          </div>
        </div>
      </div>

      {/* Swipe Indicator */}
      <div className="absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-50 z-20">
        <ChevronUp className="w-5 h-5 text-white" />
        <span className="text-white/60 text-[10px]">Swipe up</span>
      </div>
    </div>
  )
}

function ShortsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const startShortId = searchParams.get("start")
  const openCommentsFromUrl = searchParams.get("comments") === "1"
  const highlightCommentId = searchParams.get("comment")
  const createFlow = useCreateFlow()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const confirm = useConfirm()
  const uploadShort = () =>
    triggerContextualCreate("short", createFlow, { isAuthenticated, user })
  const [shortsData, setShortsData] = useState<ShortItem[]>([])
  const [feedLoaded, setFeedLoaded] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedShorts, setLikedShorts] = useState<Set<string>>(new Set())
  const [savedShorts, setSavedShorts] = useState<Set<string>>(new Set())
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [showComments, setShowComments] = useState(false)
  const [activeShortForComments, setActiveShortForComments] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setFeedLoaded(false)
    void fetchShortsFeed()
      .then((res) => {
        if (cancelled) return
        setShortsData(res.items.map(mapShortFromApi))
        setLikedShorts(new Set(res.items.filter((i) => i.liked).map((i) => i.id)))
        setSavedShorts(new Set(res.items.filter((i) => i.saved).map((i) => i.id)))
        setFollowedUsers(
          new Set(
            res.items
              .filter((i) => i.isFollowing)
              .map((i) => `@${i.channelSlug}`),
          ),
        )
      })
      .finally(() => {
        if (!cancelled) setFeedLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<{ id: string; user: string } | null>(null)
  const [comments, setComments] = useState<Record<string, VideoComment[]>>({})
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentPosting, setCommentPosting] = useState(false)
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const [deepLinkReady, setDeepLinkReady] = useState(false)

  useEffect(() => {
    if (!startShortId || !feedLoaded) return
    setDeepLinkReady(false)
    let cancelled = false

    const scrollToIndex = (index: number) => {
      setActiveIndex(index)
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = index * containerRef.current.clientHeight
        }
        setDeepLinkReady(true)
      })
    }

    const index = shortsData.findIndex((s) => s.id === startShortId)
    if (index >= 0) {
      scrollToIndex(index)
      return
    }

    void fetchVideo(startShortId)
      .then((v) => {
        if (cancelled) return
        if (v.type === "movie") {
          router.replace(`/movie/${v.id}`)
          return
        }
        if (v.type !== "short") {
          const qs = highlightCommentId
            ? `?comments=1&comment=${encodeURIComponent(highlightCommentId)}`
            : openCommentsFromUrl
              ? "?comments=1"
              : ""
          router.replace(`/watch/${v.id}${qs}`)
          return
        }
        const item = mapShortFromVideoDetail(v)
        setShortsData((prev) => [item, ...prev.filter((s) => s.id !== item.id)])
        if (item.isFollowing) {
          setFollowedUsers((prev) => new Set(prev).add(item.username))
        }
        scrollToIndex(0)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [startShortId, feedLoaded, shortsData, router, highlightCommentId, openCommentsFromUrl])

  useEffect(() => {
    if (!highlightCommentId || !showComments || commentsLoading) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`comment-${highlightCommentId}`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      el?.classList.add("ring-2", "ring-primary", "rounded-lg")
      window.setTimeout(() => {
        el?.classList.remove("ring-2", "ring-primary", "rounded-lg")
      }, 2500)
    }, 150)
    return () => window.clearTimeout(t)
  }, [highlightCommentId, showComments, commentsLoading, comments])

  const [activeTab, setActiveTab] = useState("shorts")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showAd, setShowAd] = useState(false)
  const [interstitialAd, setInterstitialAd] = useState<ServedAd | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string; url: string } | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isGiftOpen, setIsGiftOpen] = useState(false)
  const [giftTarget, setGiftTarget] = useState<{ creatorId: string; name: string; videoId: string } | null>(null)
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null)
  const [engagement, setEngagement] = useState<Record<string, EngagementCounts>>({})
  const shortsViewCount = useRef(0)
  const viewRecorded = useRef(new Set<string>())
  const { config: adsConfig, isPlacementEnabled } = usePublicAdsConfig()
  const activeShort = shortsData[activeIndex]
  useWatchAnalytics(activeShort?.id, { creatorId: activeShort?.creatorId })

  useEffect(() => {
    setEngagement((prev) => {
      const next = { ...prev }
      for (const s of shortsData) {
        if (!next[s.id]) next[s.id] = engagementFromShort(s)
      }
      return next
    })
  }, [shortsData])

  const bumpEngagement = (shortId: string, field: keyof EngagementCounts, delta: number) => {
    setEngagement((prev) => {
      const current = prev[shortId] ?? { likes: 0, comments: 0, saves: 0, shares: 0 }
      return { ...prev, [shortId]: adjustEngagement(current, field, delta) }
    })
  }

  const openShare = (short: ShortItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    setShareTarget({
      id: short.id,
      title: short.caption,
      url: `${origin}/watch/${short.id}`,
    })
    setIsShareOpen(true)
  }

  const onShareComplete = () => {
    if (shareTarget?.id) bumpEngagement(shareTarget.id, "shares", 1)
  }

  useEffect(() => {
    const short = shortsData[activeIndex]
    if (!short || viewRecorded.current.has(short.id)) return
    viewRecorded.current.add(short.id)
    void recordVideoView(short.id).catch(() => {})
  }, [activeIndex, shortsData])

  useEffect(() => {
    const short = shortsData[activeIndex]
    if (!short || !isAuthenticated) return
    void saveWatchProgress({
      contentType: "video",
      contentId: short.id,
      progressSeconds: 0,
      completed: false,
    }).catch(() => {})
  }, [activeIndex, shortsData, isAuthenticated])

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      const height = containerRef.current.clientHeight
      const newIndex = Math.round(scrollTop / height)
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < shortsData.length) {
        setActiveIndex(newIndex)
        shortsViewCount.current += 1
        const n = Math.max(1, adsConfig?.shortsInterstitialEveryNSwipes ?? 5)
        if (
          isPlacementEnabled("shorts_interstitial") &&
          (adsConfig?.shortsInterstitialEnabled ?? true) &&
          n > 0 &&
          shortsViewCount.current > 0 &&
          shortsViewCount.current % n === 0
        ) {
          void fetchServedAd("shorts_interstitial", { peek: true }).then((peekAd) => {
            if (!isValidServedAd(peekAd)) return
            setInterstitialAd(peekAd)
            setShowAd(true)
          })
        }
      }
    }
  }

  const scrollTo = (index: number) => {
    if (index >= 0 && index < shortsData.length && containerRef.current) {
      const height = containerRef.current.clientHeight
      containerRef.current.scrollTo({ top: index * height, behavior: 'smooth' })
      setActiveIndex(index)
    }
  }

  const toggleLike = (shortId: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    const wasLiked = likedShorts.has(shortId)
    void toggleVideoLike(shortId)
      .then((r) => {
        setLikedShorts((prev) => {
          const next = new Set(prev)
          if (r.liked) next.add(shortId)
          else next.delete(shortId)
          return next
        })
        if (r.liked !== wasLiked) {
          bumpEngagement(shortId, "likes", r.liked ? 1 : -1)
        }
      })
      .catch(() => {
        setLikedShorts((prev) => {
          const next = new Set(prev)
          if (wasLiked) next.delete(shortId)
          else next.add(shortId)
          return next
        })
        bumpEngagement(shortId, "likes", wasLiked ? -1 : 1)
      })
  }

  const toggleSave = (shortId: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    const wasSaved = savedShorts.has(shortId)
    void toggleVideoSave(shortId)
      .then((r) => {
        setSavedShorts((prev) => {
          const next = new Set(prev)
          if (r.saved) next.add(shortId)
          else next.delete(shortId)
          return next
        })
        if (r.saved !== wasSaved) {
          bumpEngagement(shortId, "saves", r.saved ? 1 : -1)
        }
      })
      .catch(() => {
        setSavedShorts((prev) => {
          const next = new Set(prev)
          if (wasSaved) next.delete(shortId)
          else next.add(shortId)
          return next
        })
        bumpEngagement(shortId, "saves", wasSaved ? -1 : 1)
      })
  }

  const toggleFollow = (username: string, userSlug: string) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    const wasFollowing = followedUsers.has(username)
    void (wasFollowing ? unfollowUser(userSlug) : followUser(userSlug))
      .then(() => {
        setFollowedUsers((prev) => {
          const next = new Set(prev)
          if (wasFollowing) next.delete(username)
          else next.add(username)
          return next
        })
      })
      .catch(() => {
        setFollowedUsers((prev) => {
          const next = new Set(prev)
          if (wasFollowing) next.add(username)
          else next.delete(username)
          return next
        })
      })
  }

  const commentAuthorLabel = (c: VideoComment) =>
    c.user.displayName ?? `@${c.user.username}`

  const openComments = (shortId: string) => {
    setActiveShortForComments(shortId)
    setShowComments(true)
    setCommentsLoading(true)
    void fetchVideoComments(shortId)
      .then((res) => {
        const normalized = res.items.map((item) =>
          normalizeVideoComment(item as unknown as Record<string, unknown>),
        )
        setComments((prev) => ({
          ...prev,
          [shortId]: normalized,
        }))
        setLikedCommentIds((prev) => {
          const next = new Set(prev)
          for (const c of normalized) {
            if (c.liked) next.add(c.id)
            for (const r of c.replies ?? []) {
              if (r.liked) next.add(r.id)
            }
          }
          return next
        })
        setEngagement((prev) => {
          const current = prev[shortId] ?? { likes: 0, comments: 0, saves: 0, shares: 0 }
          return { ...prev, [shortId]: { ...current, comments: res.meta.total } }
        })
      })
      .catch(() => {})
      .finally(() => setCommentsLoading(false))
  }

  useEffect(() => {
    if (!startShortId || !deepLinkReady || !openCommentsFromUrl) return
    openComments(startShortId)
  }, [startShortId, deepLinkReady, openCommentsFromUrl])

  const removeComment = async (shortId: string, commentId: string) => {
    const ok = await confirm({
      title: "Delete comment?",
      description: "This comment will be removed permanently.",
      confirmLabel: "Delete",
      variant: "destructive",
    })
    if (!ok) return
    void deleteVideoComment(commentId)
      .then((res) => {
        const removed = new Set(res.deletedIds)
        setComments((prev) => {
          const list = prev[shortId] ?? []
          return {
            ...prev,
            [shortId]: list
              .filter((c) => !removed.has(c.id))
              .map((c) => ({
                ...c,
                replies: (c.replies ?? []).filter((r) => !removed.has(r.id)),
              })),
          }
        })
        setLikedCommentIds((prev) => {
          const next = new Set(prev)
          for (const id of res.deletedIds) next.delete(id)
          return next
        })
      })
      .catch(() => {
        notify.error("Could not delete comment", {
          description: "Please try again in a moment.",
        })
      })
  }

  const toggleCommentLike = (commentId: string) => {
    if (!isAuthenticated) return setIsAuthModalOpen(true)
    void apiToggleCommentLike(commentId)
      .then((r) => {
        setLikedCommentIds((prev) => {
          const next = new Set(prev)
          if (r.liked) next.add(commentId)
          else next.delete(commentId)
          return next
        })
        if (activeShortForComments) {
          setComments((prev) => {
            const list = prev[activeShortForComments] ?? []
            return {
              ...prev,
              [activeShortForComments]: list.map((c) => {
                if (c.id === commentId) {
                  return { ...c, liked: r.liked, likesCount: r.likesCount }
                }
                if (c.replies?.length) {
                  return {
                    ...c,
                    replies: c.replies.map((reply) =>
                      reply.id === commentId
                        ? { ...reply, liked: r.liked, likesCount: r.likesCount }
                        : reply,
                    ),
                  }
                }
                return c
              }),
            }
          })
        }
      })
      .catch(() => {})
  }

  const addComment = async () => {
    const text = newComment.trim()
    if (!text || activeShortForComments === null) return
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    if (commentPosting) return

    setCommentPosting(true)
    try {
      const created = await postVideoComment(
        activeShortForComments,
        text,
        replyingTo?.id,
      )
      const normalized = normalizeVideoComment(
        created as unknown as Record<string, unknown>,
      )

      setComments((prev) => {
        const list = [...(prev[activeShortForComments] || [])]
        if (replyingTo) {
          const parentIndex = list.findIndex((c) => c.id === replyingTo.id)
          if (parentIndex > -1) {
            const parent = list[parentIndex]
            list[parentIndex] = {
              ...parent,
              replies: [...(parent.replies || []), normalized],
            }
          }
        } else {
          list.unshift(normalized)
        }
        return { ...prev, [activeShortForComments]: list }
      })
      bumpEngagement(activeShortForComments, "comments", 1)
      setNewComment("")
      setReplyingTo(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setIsAuthModalOpen(true)
    } finally {
      setCommentPosting(false)
    }
  }

  if (!feedLoaded || authLoading) {
    return <ShortsPageSkeleton />
  }

  if (feedLoaded && shortsData.length === 0) {
    return (
      <main className="h-screen bg-black overflow-hidden md:pl-20 flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-white/70 text-center">No shorts yet. Tap + to upload your first short.</p>
        <CreateHeaderButton
          variant="on-dark"
          label="Upload short"
          onClick={uploadShort}
        />
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} scope="short" />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <CreateFlowModals
          flow={createFlow}
          onNeedCreatorVerification={() => setIsAuthModalOpen(true)}
        />
      </main>
    )
  }

  return (
    <main className="h-screen bg-black overflow-hidden md:pl-20">
      {/* Shorts Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {shortsData.map((short, index) => (
          <div key={short.id} className="h-full w-full">
            <ShortVideo
              short={short}
              counts={engagement[short.id] ?? engagementFromShort(short)}
              isActive={index === activeIndex}
              onLike={() => toggleLike(short.id)}
              onComment={() => openComments(short.id)}
              onShare={() => openShare(short)}
              onSave={() => toggleSave(short.id)}
              onFollow={() => toggleFollow(short.username, short.userSlug)}
              onReport={() => {
                setReportTarget({ id: short.id, title: short.caption })
                setIsReportOpen(true)
              }}
              onGift={() => {
                setGiftTarget({
                  creatorId: short.creatorId,
                  name: short.username.replace("@", ""),
                  videoId: short.id,
                })
                setIsGiftOpen(true)
              }}
              isLiked={likedShorts.has(short.id)}
              isSaved={savedShorts.has(short.id)}
              isFollowing={followedUsers.has(short.username)}
              isSelf={!!user && short.creatorId === user.id}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setIsAuthModalOpen(true)}
              onUpload={uploadShort}
              onSearch={() => setIsSearchOpen(true)}
            />
          </div>
        ))}
      </div>

      {/* PC Navigation Controls */}
      <div className="hidden md:flex flex-col gap-4 absolute left-28 top-1/2 -translate-y-1/2 z-[100]">
        <button 
          onClick={() => scrollTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center disabled:opacity-30 transition-all text-white border border-white/20 shadow-xl"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button 
          onClick={() => scrollTo(activeIndex + 1)}
          disabled={activeIndex === shortsData.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center disabled:opacity-30 transition-all text-white border border-white/20 shadow-xl"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Comments Sheet */}
      {showComments && activeShortForComments !== null && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            onClick={() => setShowComments(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 h-[60vh] md:top-1/2 md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] md:h-[70vh] bg-background rounded-t-3xl md:rounded-3xl z-[70] flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                Comments ({(comments[activeShortForComments] || []).length})
              </h3>
              <button 
                onClick={() => setShowComments(false)}
                className="text-muted-foreground"
              >
                Close
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {commentsLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading comments…</p>
              ) : (comments[activeShortForComments] || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              ) : (
                (comments[activeShortForComments] || []).map((comment) => {
                  const commentLiked = likedCommentIds.has(comment.id)
                  return (
                  <div key={comment.id} id={`comment-${comment.id}`} className="flex flex-col gap-2 scroll-mt-4">
                    <div className="flex gap-3">
                      <img
                        src={userAvatarUrl(comment.user.avatarUrl, comment.user.username)}
                        alt={commentAuthorLabel(comment)}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{commentAuthorLabel(comment)}</span>
                          <span className="text-muted-foreground ml-2">{comment.body}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <RelativeTime date={comment.createdAt} />
                          <button 
                            className={cn("flex items-center gap-1", commentLiked && "text-primary")}
                            onClick={() => toggleCommentLike(comment.id)}
                          >
                            <Heart className={cn("w-3 h-3", commentLiked && "fill-primary")} />
                            {comment.likesCount > 0 ? comment.likesCount : null}
                          </button>
                          <button onClick={() => {
                            if (!isAuthenticated) return setIsAuthModalOpen(true);
                            setReplyingTo({ id: comment.id, user: commentAuthorLabel(comment) });
                          }}>Reply</button>
                          {user?.id === comment.user.id && activeShortForComments && (
                            <button
                              type="button"
                              className="text-destructive"
                              onClick={() => removeComment(activeShortForComments, comment.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Replies */}
                    {(comment.replies || []).length > 0 && (
                      <div className="ml-12 space-y-3 mt-2">
                        {comment.replies?.map((reply) => {
                          const replyLiked = likedCommentIds.has(reply.id)
                          return (
                          <div key={reply.id} id={`comment-${reply.id}`} className="flex gap-3 scroll-mt-4">
                            <img
                              src={userAvatarUrl(reply.user.avatarUrl, reply.user.username)}
                              alt={commentAuthorLabel(reply)}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">
                                <span className="font-semibold text-foreground">{commentAuthorLabel(reply)}</span>
                                <span className="text-muted-foreground ml-2">{reply.body}</span>
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <RelativeTime date={reply.createdAt} />
                                <button 
                                  className={cn("flex items-center gap-1", replyLiked && "text-primary")}
                                  onClick={() => toggleCommentLike(reply.id)}
                                >
                                  <Heart className={cn("w-3 h-3", replyLiked && "fill-primary")} />
                                  {reply.likesCount > 0 ? reply.likesCount : null}
                                </button>
                                {user?.id === reply.user.id && activeShortForComments && (
                                  <button
                                    type="button"
                                    className="text-destructive"
                                    onClick={() => removeComment(activeShortForComments, reply.id)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  )
                })
              )}
            </div>

            {/* Comment Input */}
            {isAuthenticated ? (
              <div className="p-4 border-t border-border flex flex-col gap-2">
                {replyingTo && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                    <span>Replying to <span className="font-semibold">{replyingTo.user}</span></span>
                    <button onClick={() => setReplyingTo(null)} className="hover:text-foreground">Cancel</button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <img
                    src={userAvatarUrl(user?.avatar, user?.username ?? user?.email ?? "user")}
                    alt="You"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                    className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    onKeyDown={(e) => e.key === "Enter" && void addComment()}
                    disabled={commentPosting}
                  />
                  <Button
                    size="sm"
                    onClick={() => void addComment()}
                    disabled={commentPosting || !newComment.trim()}
                    className="rounded-full"
                  >
                    Post
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowComments(false)
                    setIsAuthModalOpen(true)
                  }}
                  className="w-full py-3 text-center text-primary font-medium"
                >
                  Sign in to comment
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} scope="short" />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={shareTarget?.title ?? "Short"}
        url={shareTarget?.url}
        targetId={shareTarget?.id}
        onShared={onShareComplete}
      />
      {reportTarget && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false)
            setReportTarget(null)
          }}
          targetType="video"
          targetId={reportTarget.id}
          targetLabel={reportTarget.title}
        />
      )}
      {giftTarget && (
        <GiftSheet
          isOpen={isGiftOpen}
          onClose={() => {
            setIsGiftOpen(false)
            setGiftTarget(null)
          }}
          receiverId={giftTarget.creatorId}
          receiverName={giftTarget.name}
          videoId={giftTarget.videoId}
          onNeedAuth={() => setIsAuthModalOpen(true)}
        />
      )}
      {showAd && interstitialAd && (
        <AdInterstitial
          servedAd={interstitialAd}
          onClose={() => {
            setShowAd(false)
            setInterstitialAd(null)
          }}
          creatorId={shortsData[activeIndex]?.creatorId}
          videoId={shortsData[activeIndex]?.id}
        />
      )}

      <CreateFlowModals
        flow={createFlow}
        onOpenSettings={() => router.push("/profile?settings=go-live")}
        onNeedCreatorVerification={() => router.push("/profile")}
      />

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 8s linear infinite;
        }
      `}</style>
    </main>
  )
}

export default function ShortsPage() {
  return (
    <Suspense
      fallback={<ShortsPageSkeleton />}
    >
      <ShortsPageContent />
    </Suspense>
  )
}
