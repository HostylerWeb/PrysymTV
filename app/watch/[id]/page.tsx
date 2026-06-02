"use client"

import { use, useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronLeft, Share2, MoreVertical, ThumbsUp, ThumbsDown, MessageCircle,
  Bookmark, ChevronDown, ChevronUp, Send, Volume2, Maximize, Lock, Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { ReportModal } from "@/components/report-modal"
import { ShareSheet } from "@/components/share-sheet"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import { useAuth } from "@/contexts/auth-context"
import { getVideo, getSuggestedVideos } from "@/lib/mock-data"
import {
  fetchVideoWithFallback,
  fetchMoviesFeed,
  toggleVideoLike,
  toggleVideoSave,
} from "@/lib/api/videos-feed"
import {
  fetchVideoComments,
  normalizeVideoComment,
  postVideoComment,
  type VideoComment,
} from "@/lib/api/comments"
import { ApiError } from "@/lib/api-client"
import { saveWatchProgress } from "@/lib/api/history"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"

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
}

function mapApiToWatch(v: NonNullable<Awaited<ReturnType<typeof fetchVideoWithFallback>>>): WatchVideo {
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
  }
}

function mapMockToWatch(m: ReturnType<typeof getVideo>): WatchVideo {
  return {
    id: m.id,
    title: m.title,
    thumbnail: m.thumbnail,
    videoUrl: m.videoUrl,
    description: m.description,
    views: m.views,
    uploadedAt: m.uploadedAt,
    likes: m.likes,
    channel: m.channel,
    channelSlug: m.channelSlug,
    creatorId: "",
  }
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuthenticated } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [video, setVideo] = useState<WatchVideo | null>(null)
  const [suggested, setSuggested] = useState<
    Array<{ id: string; title: string; thumbnail: string; duration: string; channel: string; views: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<VideoComment[]>([])
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentPosting, setCommentPosting] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const progressSent = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const api = await fetchVideoWithFallback(id)
      if (cancelled) return
      if (api) {
        setVideo(mapApiToWatch(api))
      } else {
        setVideo(mapMockToWatch(getVideo(id)))
      }
      try {
        const feed = await fetchMoviesFeed(1)
        if (!cancelled && feed.items.length) {
          setSuggested(
            feed.items
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
        if (!cancelled) {
          setSuggested(
            getSuggestedVideos(id).map((v) => ({
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail,
              duration: v.duration,
              channel: v.channel,
              views: v.views,
            })),
          )
        }
      }
      try {
        const c = await fetchVideoComments(id)
        if (!cancelled) {
          setComments(c.items.map((item) => normalizeVideoComment(item as unknown as Record<string, unknown>)))
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
  }, [id])

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
      void toggleVideoLike(id)
        .then((r) => setIsLiked(r.liked))
        .catch(() => setIsLiked((p) => !p))
    })
  }

  const handleSave = () => {
    requireAuth(() => {
      void toggleVideoSave(id)
        .then((r) => setIsSaved(r.saved))
        .catch(() => setIsSaved((p) => !p))
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
      const created = await postVideoComment(id, text)
      const normalized = normalizeVideoComment(created as unknown as Record<string, unknown>)
      setComments((prev) => [normalized, ...prev.filter((c) => c.id !== normalized.id)])
      setCommentText("")
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
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{loading ? "Loading…" : "Video not found"}</p>
      </main>
    )
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        <div className="relative w-full aspect-video bg-black" onClick={() => setShowControls(true)}>
          <HlsVideoPlayer
            src={video.videoUrl}
            poster={video.thumbnail}
            className="w-full h-full object-contain"
            controls={false}
            videoRef={videoRef}
            onTimeUpdate={(t, d) => {
              setCurrentTime(t)
              setDuration(d)
              persistProgress(t, d)
            }}
            onEnded={() => persistProgress(duration, duration, true)}
          />
          <div className={cn("absolute inset-0 transition-opacity pointer-events-none", showControls ? "opacity-100" : "opacity-0")}>
            <div className="absolute top-0 left-0 right-0 flex justify-between p-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto">
              <Link href="/"><button type="button" className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><ChevronLeft className="w-6 h-6 text-white" /></button></Link>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsShareOpen(true)} className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></button>
                <button type="button" onClick={() => setIsReportOpen(true)} className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><Flag className="w-5 h-5 text-white" /></button>
                <button type="button" className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><MoreVertical className="w-5 h-5 text-white" /></button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 bg-gradient-to-t from-black/70 to-transparent pointer-events-auto">
              <div
                className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
                onClick={(e) => {
                  const el = videoRef.current
                  if (!el || !duration) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
                }}
              >
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-white text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const el = videoRef.current
                    if (!el) return
                    el.muted = !el.muted
                  }}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <Maximize className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <h1 className="text-lg font-semibold text-foreground mb-2">{video.title}</h1>
          <p className="text-sm text-muted-foreground mb-3">{video.views} views · {video.uploadedAt}</p>

          <div className="flex gap-2 overflow-x-auto pb-3">
            <button type="button" onClick={handleLike} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm", isLiked ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <ThumbsUp className="w-4 h-4" /> {video.likes}
            </button>
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm"><ThumbsDown className="w-4 h-4" /></button>
            <button type="button" onClick={() => setIsShareOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm"><Share2 className="w-4 h-4" /> Share</button>
            <button type="button" onClick={handleSave} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm", isSaved ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <Bookmark className="w-4 h-4" /> Save
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-y border-border">
            <Link href={`/creator/${video.channelSlug}`} className="flex items-center gap-3">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${video.channel}`} alt="" className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="text-sm font-medium">{video.channel}</h3>
                <p className="text-xs text-muted-foreground">Creator</p>
              </div>
            </Link>
            <Button onClick={() => requireAuth(() => setIsSubscribed(!isSubscribed))} className="rounded-full">
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          </div>

          <p className="py-3 text-sm text-muted-foreground">{video.description}</p>

          <div className="py-3 border-t border-border">
            <button type="button" onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5" /> Comments ({comments.length})
              {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showComments && (
              <>
                {isAuthenticated ? (
                  <div className="mb-4 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => {
                          setCommentText(e.target.value)
                          if (commentError) setCommentError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            void submitComment()
                          }
                        }}
                        placeholder="Add a comment..."
                        disabled={commentPosting}
                        className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => void submitComment()}
                        disabled={commentPosting || !commentText.trim()}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                    {commentError && (
                      <p className="text-xs text-destructive px-2">{commentError}</p>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-secondary/50 border border-dashed flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                    <Lock className="w-4 h-4" /> Sign in to comment
                  </button>
                )}
                <div className="space-y-3">
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground px-2">No comments yet. Be the first.</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <img src={c.user.avatarUrl ?? `https://api.dicebear.com/7.x/initials/svg?seed=${c.user.username}`} alt="" className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-sm font-medium">{c.user.displayName ?? c.user.username}</p>
                        <p className="text-sm text-muted-foreground">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

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
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} targetType="video" targetLabel={video.title} />
      <ShareSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title={video.title} />
    </main>
  )
}
