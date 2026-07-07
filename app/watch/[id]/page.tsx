"use client"

import { Suspense, use, useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft, Share2, ThumbsUp, ThumbsDown, MessageCircle,
  Bookmark, ChevronDown, ChevronUp, Send, Volume2, Maximize, Minimize2, Lock, Flag, ListMusic,
  Play, Pause, Gift,
} from "lucide-react"
import { GiftSheet } from "@/components/gift-sheet"
import { WatchPageSkeleton } from "@/components/content-skeletons"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/site-notifications"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { ReportModal } from "@/components/report-modal"
import { AddToPlaylistSheet } from "@/components/add-to-playlist-sheet"
import { ShareSheet } from "@/components/share-sheet"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import { VideoQualityMenu } from "@/components/video-quality-menu"
import type { HlsQualityControl } from "@/lib/hls-quality"
import { useAuth } from "@/contexts/auth-context"
import { useConfirm } from "@/contexts/confirm-context"
import {
  fetchVideo,
  fetchVideosBrowse,
  recordVideoView,
  toggleVideoLike,
  toggleVideoSave,
  toggleVideoDislike,
} from "@/lib/api/videos-feed"
import {
  fetchVideoComments,
  normalizeVideoComment,
  deleteVideoComment,
  postVideoComment,
  toggleCommentLike,
  type VideoComment,
} from "@/lib/api/comments"
import { ApiError } from "@/lib/api-client"
import { saveWatchProgress } from "@/lib/api/history"
import { RelativeTime } from "@/components/relative-time"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"
import { bumpLikeCount } from "@/lib/engagement-count"
import { userAvatarUrl } from "@/lib/user-avatar"
import { followUser, unfollowUser } from "@/lib/api/users"
import { useWatchAnalytics } from "@/lib/hooks/use-watch-analytics"
import { useImmersivePlayer } from "@/lib/hooks/use-immersive-player"
import {
  WatchCommentsPanel,
  WATCH_COMMENTS_MOBILE_PLAYER_VH,
} from "@/components/watch-comments-panel"
import { CastMediaButton } from "@/components/cast-media-button"
import { cn } from "@/lib/utils"

type WatchVideo = {
  id: string
  title: string
  thumbnail: string
  videoUrl: string
  description: string
  views: string
  uploadedAt: string
  likes: string
  channel: string
  channelSlug: string
  creatorId: string
  channelAvatar: string
}

function mapApiToWatch(v: Awaited<ReturnType<typeof fetchVideo>>): WatchVideo {
  const creator = v.creator
  return {
    id: v.id,
    title: v.title,
    thumbnail: videoThumbnail(v.thumbnailUrl),
    videoUrl: v.playbackUrl ?? v.videoUrl ?? v.hlsMasterUrl ?? "",
    description: v.description ?? "",
    views: formatViewCount(v.viewsCount),
    uploadedAt: "Recently",
    likes: formatViewCount(v.likesCount),
    channel: creator.displayName ?? creator.username,
    channelSlug: creator.username,
    creatorId: creator.id,
    channelAvatar: userAvatarUrl(creator.avatarUrl, creator.username),
  }
}

function WatchPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightCommentId = searchParams.get("comment")
  const openCommentsFromUrl = searchParams.get("comments") === "1"
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const confirm = useConfirm()
  const videoRef = useRef<HTMLVideoElement>(null)
  const {
    playerContainerRef,
    isImmersive,
    toggleImmersive,
    immersiveClassName,
  } = useImmersivePlayer()
  const [video, setVideo] = useState<WatchVideo | null>(null)
  const [suggested, setSuggested] = useState<
    Array<{ id: string; title: string; thumbnail: string; duration: string; channel: string; views: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isDisliked, setIsDisliked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; user: string } | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<VideoComment[]>([])
  const [commentsTotal, setCommentsTotal] = useState(0)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentPosting, setCommentPosting] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [isGiftOpen, setIsGiftOpen] = useState(false)
  const [qualityControl, setQualityControl] = useState<HlsQualityControl | null>(null)
  const progressSent = useRef(0)
  const viewRecorded = useRef(false)
  useWatchAnalytics(video?.id, { creatorId: video?.creatorId })

  useEffect(() => {
    viewRecorded.current = false
  }, [id])

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setIsLiked(false)
      setLikesCount(0)
      setIsDisliked(false)
      setIsSaved(false)
      setIsSubscribed(false)
      setReplyingTo(null)
      try {
        const api = await fetchVideo(id)
        if (cancelled) return
        if (api.type === "short") {
          const params = new URLSearchParams({ start: id })
          if (highlightCommentId) {
            params.set("comments", "1")
            params.set("comment", highlightCommentId)
          } else if (openCommentsFromUrl) {
            params.set("comments", "1")
          }
          router.replace(`/shorts?${params}`)
          return
        }
        if (api.type === "movie") {
          router.replace(`/movie/${id}`)
          return
        }
        setVideo(mapApiToWatch(api))
        setLikesCount(api.likesCount ?? 0)
        setIsLiked(api.liked ?? false)
        setIsDisliked(api.disliked ?? false)
        setIsSaved(api.saved ?? false)
        setIsSubscribed(api.isFollowing ?? false)
      } catch {
        if (!cancelled) setVideo(null)
      }
      try {
        const feed = await fetchVideosBrowse({ page: 1, limit: 12, mode: "videos" })
        if (!cancelled && feed.videos.items.length) {
          setSuggested(
            feed.videos.items
              .filter((v) => v.id !== id)
              .slice(0, 4)
              .map((v) => ({
                id: v.id,
                title: v.title,
                thumbnail: videoThumbnail(v.thumbnailUrl),
                duration: formatDuration(v.durationSeconds),
                channel: v.channel,
                views: formatViewCount(v.viewsCount),
              })),
          )
        }
      } catch {
        /* no suggestions */
      }
      try {
        const c = await fetchVideoComments(id, 1)
        if (!cancelled) {
          setComments(
            c.items.map((item) => normalizeVideoComment(item as unknown as Record<string, unknown>)),
          )
          setCommentsTotal(c.meta.total)
        }
      } catch {
        /* keep empty */
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id, authLoading, isAuthenticated, router, highlightCommentId, openCommentsFromUrl])

  useEffect(() => {
    if (!highlightCommentId && !openCommentsFromUrl) return
    setCommentsOpen(true)
  }, [highlightCommentId, openCommentsFromUrl])

  useEffect(() => {
    if (!highlightCommentId || loading) return
    const t = window.setTimeout(() => {
      const el = document.getElementById(`comment-${highlightCommentId}`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      el?.classList.add("ring-2", "ring-primary", "rounded-lg")
      window.setTimeout(() => {
        el?.classList.remove("ring-2", "ring-primary", "rounded-lg")
      }, 2500)
    }, 200)
    return () => window.clearTimeout(t)
  }, [highlightCommentId, loading, comments])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onPlayEvt = () => setIsPlaying(true)
    const onPauseEvt = () => setIsPlaying(false)
    el.addEventListener("play", onPlayEvt)
    el.addEventListener("pause", onPauseEvt)
    return () => {
      el.removeEventListener("play", onPlayEvt)
      el.removeEventListener("pause", onPauseEvt)
    }
  }, [video])

  const persistProgress = useCallback(
    (seconds: number, dur: number, completed = false) => {
      if (!isAuthenticated || !video) return
      const bucket = Math.floor(seconds / 10)
      if (!completed && bucket === progressSent.current) return
      progressSent.current = bucket
      void saveWatchProgress({
        contentType: "video",
        contentId: video.id,
        progressSeconds: Math.floor(seconds),
        completed,
      }).catch(() => {})
    },
    [isAuthenticated, video],
  )

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) setIsAuthModalOpen(true)
    else action()
  }

  const handleLike = () => {
    requireAuth(() => {
      const wasLiked = isLiked
      void toggleVideoLike(id)
        .then((r) => {
          setIsLiked(r.liked)
          setLikesCount((c) => bumpLikeCount(c, wasLiked, r.liked))
          if (r.disliked === false) setIsDisliked(false)
        })
        .catch(() => {
          setIsLiked((p) => !p)
          setLikesCount((c) => bumpLikeCount(c, wasLiked, !wasLiked))
        })
    })
  }

  const handleSave = () => {
    requireAuth(() => {
      void toggleVideoSave(id)
        .then((r) => setIsSaved(r.saved))
        .catch(() => setIsSaved((p) => !p))
    })
  }

  const handleDislike = () => {
    requireAuth(() => {
      const wasLiked = isLiked
      void toggleVideoDislike(id)
        .then((r) => {
          setIsDisliked(r.disliked)
          if (r.liked === false && wasLiked) {
            setIsLiked(false)
            setLikesCount((c) => Math.max(0, c - 1))
          }
        })
        .catch(() => setIsDisliked((p) => !p))
    })
  }

  const recordViewOnce = useCallback(() => {
    if (viewRecorded.current) return
    viewRecorded.current = true
    void recordVideoView(id).catch(() => {})
  }, [id])

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      void el.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }, [])

  const removeComment = async (commentId: string) => {
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
        setComments((prev) =>
          prev
            .filter((c) => !removed.has(c.id))
            .map((c) => ({
              ...c,
              replies: (c.replies ?? []).filter((r) => !removed.has(r.id)),
            })),
        )
        setCommentsTotal((t) => Math.max(0, t - res.deletedIds.length))
      })
      .catch(() => {
        notify.error("Could not delete comment", {
          description: "Please try again in a moment.",
        })
      })
  }

  const handleCommentLike = (commentId: string) => {
    requireAuth(() => {
      void toggleCommentLike(commentId)
        .then((r) => {
          setComments((prev) =>
            prev.map((c) => {
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
          )
        })
        .catch(() => {})
    })
  }

  const submitComment = async () => {
    const text = commentText.trim()
    if (!text || commentPosting) return
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setCommentPosting(true)
    setCommentError(null)
    try {
      const created = await postVideoComment(id, text, replyingTo?.id)
      const normalized = normalizeVideoComment(created as unknown as Record<string, unknown>)
      if (replyingTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo.id
              ? { ...c, replies: [...(c.replies ?? []), normalized] }
              : c,
          ),
        )
      } else {
        setComments((prev) => [normalized, ...prev.filter((c) => c.id !== normalized.id)])
        setCommentsTotal((t) => t + 1)
      }
      setCommentText("")
      setReplyingTo(null)
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.status === 401
            ? "Sign in to comment."
            : e.message
          : "Could not post comment. Try again."
      setCommentError(msg)
      if (e instanceof ApiError && e.status === 401) setIsAuthModalOpen(true)
    } finally {
      setCommentPosting(false)
    }
  }

  if (loading || !video) {
    return loading ? <WatchPageSkeleton /> : (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Video not found</p>
      </main>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        {commentsOpen && (
          <div
            className="md:hidden w-full shrink-0"
            style={{ height: `${WATCH_COMMENTS_MOBILE_PLAYER_VH}vh` }}
            aria-hidden
          />
        )}
        <div
          ref={playerContainerRef}
          className={cn(
            "relative w-full aspect-video bg-black group",
            commentsOpen &&
              "md:relative fixed top-0 left-0 right-0 z-[60] w-full max-md:h-[32vh] max-md:max-h-[32vh] max-md:aspect-auto md:max-h-none md:h-auto md:aspect-video",
            isImmersive && !commentsOpen && immersiveClassName,
          )}
          onClick={() => {
            setShowControls(true)
            togglePlay()
          }}
        >
          <HlsVideoPlayer
            src={video.videoUrl}
            poster={video.thumbnail}
            className="w-full h-full object-contain pointer-events-none"
            controls={false}
            disableNativeFullscreen
            onNativeFullscreenBlocked={toggleImmersive}
            onQualityControlReady={setQualityControl}
            muted={isMuted}
            videoRef={videoRef}
            onPlay={() => {
              setIsPlaying(true)
              recordViewOnce()
            }}
            onTimeUpdate={(t, d) => {
              setCurrentTime(t)
              setDuration(d)
              recordViewOnce()
              persistProgress(t, d)
            }}
            onEnded={() => {
              setIsPlaying(false)
              persistProgress(duration, duration, true)
            }}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center border border-white/30">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
          <div
            className={cn("absolute inset-0 transition-opacity pointer-events-none", showControls ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 flex justify-between p-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
              <Link href="/"><button type="button" className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><ChevronLeft className="w-6 h-6 text-white" /></button></Link>
              <div className="flex gap-2">
                <CastMediaButton
                  variant="on-video"
                  media={
                    video?.videoUrl
                      ? {
                          title: video.title,
                          subtitle: video.channel,
                          streamUrl: video.videoUrl,
                          posterUrl: video.thumbnail,
                        }
                      : null
                  }
                  getCurrentTime={() => videoRef.current?.currentTime ?? 0}
                  onCastStarted={() => {
                    const el = videoRef.current
                    if (el && !el.paused) el.pause()
                  }}
                />
                <button type="button" onClick={() => setIsShareOpen(true)} className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></button>
                <button type="button" onClick={() => setIsReportOpen(true)} className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><Flag className="w-5 h-5 text-white" /></button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
              <div
                className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  const el = videoRef.current
                  if (!el || !duration) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
                }}
              >
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePlay()
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 fill-white" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const el = videoRef.current
                      if (!el) return
                      el.muted = !el.muted
                      setIsMuted(el.muted)
                    }}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <VideoQualityMenu control={qualityControl} variant="compact" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleImmersive()
                  }}
                  aria-label={isImmersive ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isImmersive ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <h1 className="text-lg font-semibold text-foreground mb-2">{video.title}</h1>
          <p className="text-sm text-muted-foreground mb-3">{video.views} views · {video.uploadedAt}</p>

          <div className="flex gap-2 overflow-x-auto pb-3">
            <button type="button" onClick={handleLike} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm", isLiked ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <ThumbsUp className="w-4 h-4" /> {formatViewCount(likesCount)}
            </button>
            <button type="button" onClick={handleDislike} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm", isDisliked ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <ThumbsDown className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => requireAuth(() => setIsGiftOpen(true))} className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm">
              <Gift className="w-4 h-4" /> Gift
            </button>
            <button type="button" onClick={() => setIsShareOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm"><Share2 className="w-4 h-4" /> Share</button>
            <button type="button" onClick={handleSave} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm", isSaved ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <Bookmark className="w-4 h-4" /> Save
            </button>
            <button
              type="button"
              onClick={() => requireAuth(() => setIsPlaylistOpen(true))}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm"
            >
              <ListMusic className="w-4 h-4" /> Playlist
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-y border-border">
            <Link href={`/creator/${video.channelSlug}`} className="flex items-center gap-3">
              <img src={video.channelAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <h3 className="text-sm font-medium">{video.channel}</h3>
                <p className="text-xs text-muted-foreground">Creator</p>
              </div>
            </Link>
            <Button
              onClick={() =>
                requireAuth(() => {
                  const next = !isSubscribed
                  void (next ? followUser(video.channelSlug) : unfollowUser(video.channelSlug))
                    .then(() => setIsSubscribed(next))
                    .catch(() => setIsSubscribed(next))
                })
              }
              className="rounded-full"
            >
              {isSubscribed ? "Following" : "Follow"}
            </Button>
          </div>

          <p className="py-3 text-sm text-muted-foreground">{video.description}</p>

          <WatchCommentsPanel
              videoId={id}
              open={commentsOpen}
              onOpenChange={setCommentsOpen}
              comments={comments}
              commentsTotal={commentsTotal}
              onCommentsChange={setComments}
              onTotalChange={setCommentsTotal}
              isAuthenticated={isAuthenticated}
              currentUserId={user?.id}
              currentUserAvatar={user?.avatar}
              currentUserLabel={user?.username ?? user?.email ?? "user"}
              commentText={commentText}
              onCommentTextChange={setCommentText}
              commentError={commentError}
              onCommentErrorChange={setCommentError}
              commentPosting={commentPosting}
              onSubmitComment={() => void submitComment()}
              replyingTo={replyingTo}
              onReplyingToChange={setReplyingTo}
              onRequireAuth={() => setIsAuthModalOpen(true)}
              onCommentLike={handleCommentLike}
              onRemoveComment={removeComment}
              highlightCommentId={highlightCommentId}
            />

          <div className="py-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-4">Up Next</h3>
            <div className="space-y-4">
              {suggested.map((v) => (
                <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-3 group">
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">{v.duration}</span>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="text-sm font-medium line-clamp-2">{v.title}</h4>
                    <p className="text-xs text-muted-foreground">{v.channel} · {v.views}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="video"
        targetId={video.id}
        targetLabel={video.title}
      />
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={video.title}
        targetId={video.id}
      />
      {video && (
        <AddToPlaylistSheet
          isOpen={isPlaylistOpen}
          onClose={() => setIsPlaylistOpen(false)}
          itemType="video"
          itemId={video.id}
          itemTitle={video.title}
        />
      )}
      <GiftSheet
        isOpen={isGiftOpen}
        onClose={() => setIsGiftOpen(false)}
        receiverId={video.creatorId}
        receiverName={video.channel}
        videoId={video.id}
        onNeedAuth={() => setIsAuthModalOpen(true)}
      />
    </main>
  )
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<WatchPageSkeleton />}>
      <WatchPageContent params={params} />
    </Suspense>
  )
}
