"use client"

import { use, useState, useRef, useEffect } from "react"
import {
  ChevronLeft, Share2, MoreVertical, ThumbsUp, ThumbsDown, MessageCircle,
  Bookmark, ChevronDown, ChevronUp, Heart, Send, Play, Pause, Volume2,
  VolumeX, Maximize, SkipBack, SkipForward, Lock, Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { ReportModal } from "@/components/report-modal"
import { ShareSheet } from "@/components/share-sheet"
import { useAuth } from "@/contexts/auth-context"
import { getVideo, getSuggestedVideos } from "@/lib/mock-data"

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const video = getVideo(id)
  const suggested = getSuggestedVideos(id)
  const { isAuthenticated } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onTime = () => setCurrentTime(el.currentTime)
    const onMeta = () => setDuration(el.duration)
    const onEnd = () => setIsPlaying(false)
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("loadedmetadata", onMeta)
    el.addEventListener("ended", onEnd)
    return () => {
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("loadedmetadata", onMeta)
      el.removeEventListener("ended", onEnd)
    }
  }, [])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) setIsAuthModalOpen(true)
    else action()
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        <div className="relative w-full aspect-video bg-black" onClick={() => setShowControls(true)}>
          <video ref={videoRef} src={video.videoUrl} poster={video.thumbnail} className="w-full h-full object-contain" playsInline onClick={() => {
            const el = videoRef.current
            if (!el) return
            if (isPlaying) el.pause()
            else el.play()
            setIsPlaying(!isPlaying)
          }} />
          <div className={cn("absolute inset-0 transition-opacity", showControls ? "opacity-100" : "opacity-0")}>
            <div className="absolute top-0 left-0 right-0 flex justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
              <Link href="/"><button className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><ChevronLeft className="w-6 h-6 text-white" /></button></Link>
              <div className="flex gap-2">
                <button onClick={() => setIsShareOpen(true)} className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></button>
                <button onClick={() => setIsReportOpen(true)} className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><Flag className="w-5 h-5 text-white" /></button>
                <button className="w-10 h-10 rounded-full bg-background/20 flex items-center justify-center"><MoreVertical className="w-5 h-5 text-white" /></button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 bg-gradient-to-t from-black/70 to-transparent">
              <div className="w-full h-1 bg-white/30 rounded-full mb-2" onClick={(e) => {
                const el = videoRef.current
                if (!el) return
                const rect = e.currentTarget.getBoundingClientRect()
                el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
              }}>
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-white text-xs">
                <button onClick={() => { videoRef.current!.muted = !isMuted; setIsMuted(!isMuted) }}>
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
            <button onClick={() => requireAuth(() => setIsLiked(!isLiked))} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm", isLiked ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <ThumbsUp className="w-4 h-4" /> {video.likes}
            </button>
            <button onClick={() => requireAuth(() => {})} className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm"><ThumbsDown className="w-4 h-4" /></button>
            <button onClick={() => setIsShareOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm"><Share2 className="w-4 h-4" /> Share</button>
            <button onClick={() => requireAuth(() => setIsSaved(!isSaved))} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm", isSaved ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              <Bookmark className="w-4 h-4" /> Save
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-y border-border">
            <Link href={`/creator/${video.channelSlug}`} className="flex items-center gap-3">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${video.channel}`} alt="" className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="text-sm font-medium">{video.channel}</h3>
                <p className="text-xs text-muted-foreground">12.5M subscribers</p>
              </div>
            </Link>
            <Button onClick={() => requireAuth(() => setIsSubscribed(!isSubscribed))} className="rounded-full">
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          </div>

          <p className="py-3 text-sm text-muted-foreground">{video.description}</p>

          <div className="py-3 border-t border-border">
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5" /> Comments
              {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showComments && (
              isAuthenticated ? (
                <div className="flex gap-2 mb-4">
                  <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm" />
                  <button onClick={() => setCommentText("")} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><Send className="w-4 h-4 text-primary-foreground" /></button>
                </div>
              ) : (
                <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 rounded-xl bg-secondary/50 border border-dashed flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" /> Sign in to comment
                </button>
              )
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

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} targetType="video" targetLabel={video.title} />
      <ShareSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title={video.title} />
    </main>
  )
}
