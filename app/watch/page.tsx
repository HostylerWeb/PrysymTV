"use client"

import { useState, useRef, useEffect } from "react"
import { 
  ChevronLeft, 
  Share2, 
  MoreVertical, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Bookmark,
  ChevronDown,
  ChevronUp,
  Heart,
  Send,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/contexts/auth-context"

// Sample video URL (Big Buck Bunny - free to use)
const VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
const VIDEO_POSTER = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop"

// Mock comment data
const comments = [
  {
    id: "1",
    user: "Alex Gaming",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    text: "This is absolutely incredible! The production quality is top-notch. Can't wait for the next episode!",
    likes: 2453,
    time: "2 hours ago",
    isLiked: false,
    replies: [
      {
        id: "1-1",
        user: "Sarah Miller",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        text: "Totally agree! The cinematography is stunning.",
        likes: 342,
        time: "1 hour ago",
        isLiked: true,
      },
      {
        id: "1-2",
        user: "Mike Johnson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        text: "Best content on the platform right now!",
        likes: 89,
        time: "45 min ago",
        isLiked: false,
      }
    ]
  },
  {
    id: "2",
    user: "Emma Watson",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    text: "The plot twist at 15:32 had me shook! Never saw that coming. This creator always delivers quality content.",
    likes: 1892,
    time: "4 hours ago",
    isLiked: true,
    replies: []
  },
  {
    id: "3",
    user: "John Doe",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    text: "Been following this channel for 3 years now. The growth is unreal. Keep up the amazing work!",
    likes: 756,
    time: "6 hours ago",
    isLiked: false,
    replies: [
      {
        id: "3-1",
        user: "Lisa Chen",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        text: "Same here! Day one supporter",
        likes: 123,
        time: "5 hours ago",
        isLiked: false,
      }
    ]
  },
]

const suggestedVideos = [
  { id: "1", title: "Building a $1M Business in 30 Days", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=170&fit=crop", channel: "Business Minds", views: "2.3M", duration: "24:15" },
  { id: "2", title: "Epic Mountain Bike Trail POV", thumbnail: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=300&h=170&fit=crop", channel: "Adventure Sports", views: "1.5M", duration: "12:33" },
  { id: "3", title: "How AI is Changing Everything", thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=170&fit=crop", channel: "Tech Insights", views: "5.2M", duration: "28:45" },
  { id: "4", title: "Travel Vlog: Hidden Gems of Japan", thumbnail: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&h=170&fit=crop", channel: "Wanderlust", views: "1.8M", duration: "22:10" },
]

interface Comment {
  id: string
  user: string
  avatar: string
  text: string
  likes: number
  time: string
  isLiked: boolean
  replies?: Comment[]
}

function CommentItem({ 
  comment, 
  isReply = false, 
  isAuthenticated,
  onLoginRequired
}: { 
  comment: Comment
  isReply?: boolean
  isAuthenticated: boolean
  onLoginRequired: () => void
}) {
  const [isLiked, setIsLiked] = useState(comment.isLiked)
  const [likes, setLikes] = useState(comment.likes)
  const [showReplies, setShowReplies] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")

  const handleLike = () => {
    if (!isAuthenticated) {
      onLoginRequired()
      return
    }
    if (isLiked) {
      setLikes(likes - 1)
    } else {
      setLikes(likes + 1)
    }
    setIsLiked(!isLiked)
  }

  const handleReply = () => {
    if (!isAuthenticated) {
      onLoginRequired()
      return
    }
    setIsReplying(!isReplying)
  }

  return (
    <div className={cn("flex gap-3", isReply && "ml-12")}>
      <img 
        src={comment.avatar} 
        alt={comment.user}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          isReply ? "w-8 h-8" : "w-10 h-10"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">{comment.user}</span>
          <span className="text-xs text-muted-foreground">{comment.time}</span>
        </div>
        <p className="text-sm text-foreground/90 mb-2">{comment.text}</p>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Heart 
              className={cn(
                "w-4 h-4 transition-colors",
                isLiked && "fill-primary text-primary"
              )} 
            />
            <span className="text-xs">{likes.toLocaleString()}</span>
          </button>
          {!isReply && (
            <button 
              onClick={handleReply}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {isReplying && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button 
              onClick={() => setIsReplying(false)}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        )}

        {!isReply && comment.replies && comment.replies.length > 0 && (
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 mt-2 text-primary text-sm font-medium"
          >
            {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
          </button>
        )}

        {showReplies && comment.replies && (
          <div className="mt-3 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                isReply 
                isAuthenticated={isAuthenticated}
                onLoginRequired={onLoginRequired}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function WatchPage() {
  const { isAuthenticated } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [showComments, setShowComments] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000)
    }
    return () => clearTimeout(timeout)
  }, [isPlaying, showControls])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const seek = (seconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration))
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    video.currentTime = percent * duration
  }

  const handleLike = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsLiked(!isLiked)
    if (isDisliked) setIsDisliked(false)
  }

  const handleDislike = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsDisliked(!isDisliked)
    if (isLiked) setIsLiked(false)
  }

  const handleSave = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsSaved(!isSaved)
  }

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsSubscribed(!isSubscribed)
  }

  const handleCommentSubmit = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    // Handle comment submission
    setCommentText("")
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
      {/* Video Player */}
      <div 
        className="relative w-full aspect-video bg-black"
        onClick={() => setShowControls(true)}
      >
        <video
          ref={videoRef}
          src={VIDEO_URL}
          poster={VIDEO_POSTER}
          className="w-full h-full object-contain"
          playsInline
          onClick={togglePlay}
        />
        
        {/* Controls overlay */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
          
          {/* Top Navigation */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3">
            <Link href="/">
              <button className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Center play controls */}
          <div className="absolute inset-0 flex items-center justify-center gap-8">
            <button 
              onClick={(e) => { e.stopPropagation(); seek(-10); }}
              className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center"
            >
              <SkipBack className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
              )}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); seek(10); }}
              className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center"
            >
              <SkipForward className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Bottom gradient and controls */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
              {/* Progress bar */}
              <div 
                className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-primary rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              {/* Time and controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <span className="text-xs text-white">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <button className="w-8 h-8 flex items-center justify-center">
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="px-4 pt-4">
        <h1 className="text-lg font-semibold text-foreground mb-2 text-pretty">
          The Last Frontier - Official Trailer | A Journey Beyond Imagination
        </h1>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>2.3M views</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span>3 days ago</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4">
          <button 
            onClick={handleLike}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0",
              isLiked ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            )}
          >
            <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")} />
            <span>124K</span>
          </button>
          <button 
            onClick={handleDislike}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0",
              isDisliked ? "bg-secondary/80 text-foreground" : "bg-secondary text-foreground"
            )}
          >
            <ThumbsDown className={cn("w-4 h-4", isDisliked && "fill-current")} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground text-sm font-medium flex-shrink-0">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button 
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0",
              isSaved ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            <span>Save</span>
          </button>
        </div>

        {/* Channel Info */}
        <div className="flex items-center justify-between py-3 border-t border-b border-border">
          <Link href="/creator/streamverse-originals" className="flex items-center gap-3">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
              alt="Channel"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="text-sm font-medium text-foreground">StreamVerse Originals</h3>
              <p className="text-xs text-muted-foreground">12.5M subscribers</p>
            </div>
          </Link>
          <Button 
            onClick={handleSubscribe}
            className={cn(
              "rounded-full",
              isSubscribed ? "bg-secondary text-foreground hover:bg-secondary/80" : ""
            )}
          >
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </Button>
        </div>

        {/* Description */}
        <div className="py-3">
          <div className={cn("text-sm text-muted-foreground", !showFullDescription && "line-clamp-2")}>
            An epic journey through uncharted territories where courage meets destiny. Follow the remarkable story of explorers facing the unknown in this breathtaking cinematic experience.
            {showFullDescription && (
              <>
                <br /><br />
                Directed by acclaimed filmmaker James Anderson, this production brings together an all-star cast in a story that will keep you on the edge of your seat.
                <br /><br />
                Tags: #adventure #epic #cinema #trending
              </>
            )}
          </div>
          <button 
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-sm font-medium text-primary mt-1"
          >
            {showFullDescription ? "Show less" : "Show more"}
          </button>
        </div>

        {/* Comments Section */}
        <div className="py-3 border-t border-border">
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-between w-full mb-4"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">Comments</span>
              <span className="text-sm text-muted-foreground">2.4K</span>
            </div>
            {showComments ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {showComments && (
            <>
              {/* Comment Input */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3 mb-6">
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {commentText && (
                      <button 
                        onClick={handleCommentSubmit}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Send className="w-4 h-4 text-primary-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 mb-6 rounded-xl bg-secondary/50 border border-dashed border-border hover:bg-secondary transition-colors"
                >
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sign in to comment</span>
                </button>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    isAuthenticated={isAuthenticated}
                    onLoginRequired={() => setIsAuthModalOpen(true)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Up Next */}
        <div className="py-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Up Next</h3>
          <div className="space-y-4">
            {suggestedVideos.map((video) => (
              <Link key={video.id} href="/watch">
                <div className="flex gap-3 cursor-pointer group">
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img 
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {video.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">{video.channel}</p>
                    <p className="text-xs text-muted-foreground">{video.views} views</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  )
}
