"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Music2,
  MoreVertical,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"

import { AdInterstitial } from "@/components/ad-interstitial"
import { ShareSheet } from "@/components/share-sheet"
import { HlsVideoPlayer } from "@/components/hls-video-player"
import { mockShorts } from "@/lib/mock-data"
import { fetchShortsFeed } from "@/lib/api/videos-feed"
import { formatViewCount } from "@/lib/format-media"
import type { VideoCard } from "@/lib/api/feed"

export type ShortItem = {
  id: string
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

function mapShortFromApi(card: VideoCard): ShortItem {
  return {
    id: card.id,
    videoUrl: card.playbackUrl ?? card.videoUrl ?? "",
    username: `@${card.channelSlug}`,
    userSlug: card.channelSlug,
    userAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${card.channelSlug}`,
    caption: card.title,
    likes: formatViewCount(card.viewsCount),
    comments: "0",
    shares: "0",
    saves: "0",
    music: `Original Sound - ${card.channelSlug}`,
    isFollowing: false,
  }
}

const fallbackShorts: ShortItem[] = mockShorts.map((s) => ({
  id: String(s.id),
  videoUrl: s.videoUrl,
  username: s.username,
  userSlug: s.userSlug,
  userAvatar: s.userAvatar,
  caption: s.caption,
  likes: s.likes,
  comments: s.comments,
  shares: s.shares,
  saves: s.saves,
  music: s.music,
  isFollowing: s.isFollowing,
}))

interface ShortVideoProps {
  short: ShortItem
  isActive: boolean
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onSave: () => void
  onFollow: () => void
  isLiked: boolean
  isSaved: boolean
  isFollowing: boolean
  isAuthenticated: boolean
  onAuthRequired: () => void
}

function ShortVideo({ 
  short, 
  isActive, 
  onLike, 
  onComment, 
  onShare, 
  onSave, 
  onFollow,
  isLiked,
  isSaved,
  isFollowing,
  isAuthenticated,
  onAuthRequired
}: ShortVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {})
        setIsPlaying(true)
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setIsPlaying(false)
      }
    }
  }, [isActive])

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
    <div className="relative w-full h-full bg-black snap-start snap-always">
      {/* Video */}
      <HlsVideoPlayer
        src={short.videoUrl}
        className="w-full h-full object-cover"
        controls={false}
        muted={isMuted}
        playsInline
        loop
        videoRef={videoRef}
      />
      <button type="button" className="absolute inset-0 z-10" onClick={togglePlay} aria-label="Toggle play" />

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
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <h1 className="text-lg font-bold text-white">Shorts</h1>
        <div className="flex items-center gap-3">
          <button onClick={toggleMute} className="p-2">
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
          <button className="p-2">
            <MoreVertical className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
        {/* Profile */}
        <div className="flex flex-col items-center gap-1">
          <Link href={`/creator/${short.userSlug}`}>
            <div className="relative">
              <img
                src={short.userAvatar}
                alt={short.username}
                className="w-12 h-12 rounded-full border-2 border-white object-cover"
              />
              {!isFollowing && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleAction(onFollow)
                  }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
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
            "w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center",
            isLiked && "bg-primary/20"
          )}>
            <Heart className={cn(
              "w-7 h-7 text-white transition-all",
              isLiked && "fill-primary text-primary scale-110"
            )} />
          </div>
          <span className="text-white text-xs font-medium">{short.likes}</span>
        </button>

        {/* Comment */}
        <button 
          onClick={() => handleAction(onComment)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{short.comments}</span>
        </button>

        {/* Save/Bookmark */}
        <button 
          onClick={() => handleAction(onSave)}
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            "w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center",
            isSaved && "bg-yellow-500/20"
          )}>
            <Bookmark className={cn(
              "w-7 h-7 text-white transition-all",
              isSaved && "fill-yellow-500 text-yellow-500"
            )} />
          </div>
          <span className="text-white text-xs font-medium">{short.saves}</span>
        </button>

        {/* Share */}
        <button 
          onClick={onShare}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{short.shares}</span>
        </button>

      </div>

      {/* Bottom Info */}
      <div className="absolute left-0 right-16 bottom-24 p-4 z-10">
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
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-50">
        <ChevronUp className="w-5 h-5 text-white" />
        <span className="text-white/60 text-[10px]">Swipe up</span>
      </div>
    </div>
  )
}

export default function ShortsPage() {
  const { user, isAuthenticated } = useAuth()
  const [shortsData, setShortsData] = useState<ShortItem[]>(fallbackShorts)
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedShorts, setLikedShorts] = useState<Set<string>>(new Set())
  const [savedShorts, setSavedShorts] = useState<Set<string>>(new Set())
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set(
    shortsData.filter(s => s.isFollowing).map(s => s.username)
  ))
  const [showComments, setShowComments] = useState(false)
  const [activeShortForComments, setActiveShortForComments] = useState<string | null>(null)

  useEffect(() => {
    void fetchShortsFeed().then((res) => {
      if (res.items.length) {
        setShortsData(res.items.map(mapShortFromApi))
      }
    })
  }, [])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<{id: number, user: string} | null>(null)

  type CommentType = {id: number, user: string, text: string, likes: number, avatar: string, isLiked?: boolean, replies?: CommentType[]}
  const [comments, setComments] = useState<Record<string, CommentType[]>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("shorts")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showAd, setShowAd] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState<{ title: string; url: string } | null>(null)
  const shortsViewCount = useRef(0)

  const openShare = (short: ShortItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    setShareTarget({
      title: short.caption,
      url: `${origin}/watch/${short.id}`,
    })
    setIsShareOpen(true)
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      const height = containerRef.current.clientHeight
      const newIndex = Math.round(scrollTop / height)
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < shortsData.length) {
        setActiveIndex(newIndex)
        shortsViewCount.current += 1
        if (shortsViewCount.current > 0 && shortsViewCount.current % 5 === 0) {
          setShowAd(true)
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
    setLikedShorts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(shortId)) {
        newSet.delete(shortId)
      } else {
        newSet.add(shortId)
      }
      return newSet
    })
  }

  const toggleSave = (shortId: string) => {
    setSavedShorts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(shortId)) {
        newSet.delete(shortId)
      } else {
        newSet.add(shortId)
      }
      return newSet
    })
  }

  const toggleFollow = (username: string) => {
    setFollowedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(username)) {
        newSet.delete(username)
      } else {
        newSet.add(username)
      }
      return newSet
    })
  }

  const openComments = (shortId: string) => {
    setActiveShortForComments(shortId)
    setShowComments(true)
  }

  const toggleCommentLike = (commentId: number, isReply: boolean = false, parentId?: number) => {
    if (!isAuthenticated) return setIsAuthModalOpen(true);
    if (!activeShortForComments) return;
    setComments(prev => {
      const shortComments = [...(prev[activeShortForComments] || [])];
      
      if (!isReply) {
        const commentIndex = shortComments.findIndex(c => c.id === commentId);
        if (commentIndex > -1) {
          const comment = shortComments[commentIndex];
          shortComments[commentIndex] = {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked
          };
        }
      } else if (parentId) {
        const parentIndex = shortComments.findIndex(c => c.id === parentId);
        if (parentIndex > -1) {
          const parent = shortComments[parentIndex];
          const replies = [...(parent.replies || [])];
          const replyIndex = replies.findIndex(r => r.id === commentId);
          if (replyIndex > -1) {
            const reply = replies[replyIndex];
            replies[replyIndex] = {
              ...reply,
              likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
              isLiked: !reply.isLiked
            };
            shortComments[parentIndex] = { ...parent, replies };
          }
        }
      }
      return { ...prev, [activeShortForComments]: shortComments };
    });
  };

  const addComment = () => {
    if (!newComment.trim() || activeShortForComments === null) return
    
    const newCommentObj = {
      id: Date.now(),
      user: user?.name ? `@${user.name.toLowerCase().replace(' ', '_')}` : "@user",
      text: newComment,
      likes: 0,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`,
      replies: []
    }
    
    setComments(prev => {
      const shortComments = [...(prev[activeShortForComments] || [])];
      if (replyingTo) {
        const parentIndex = shortComments.findIndex(c => c.id === replyingTo.id);
        if (parentIndex > -1) {
          const parent = shortComments[parentIndex];
          shortComments[parentIndex] = {
            ...parent,
            replies: [...(parent.replies || []), newCommentObj]
          };
        }
      } else {
        shortComments.push(newCommentObj);
      }
      return { ...prev, [activeShortForComments]: shortComments };
    });
    setNewComment("");
    setReplyingTo(null);
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
              isActive={index === activeIndex}
              onLike={() => toggleLike(short.id)}
              onComment={() => openComments(short.id)}
              onShare={() => openShare(short)}
              onSave={() => toggleSave(short.id)}
              onFollow={() => toggleFollow(short.username)}
              isLiked={likedShorts.has(short.id)}
              isSaved={savedShorts.has(short.id)}
              isFollowing={followedUsers.has(short.username)}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setIsAuthModalOpen(true)}
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
              {(comments[activeShortForComments] || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              ) : (
                (comments[activeShortForComments] || []).map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-2">
                    <div className="flex gap-3">
                      <img
                        src={comment.avatar}
                        alt={comment.user}
                        className="w-9 h-9 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{comment.user}</span>
                          <span className="text-muted-foreground ml-2">{comment.text}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>2h</span>
                          <button 
                            className={cn("flex items-center gap-1", comment.isLiked && "text-primary")}
                            onClick={() => toggleCommentLike(comment.id)}
                          >
                            <Heart className={cn("w-3 h-3", comment.isLiked && "fill-primary")} />
                            {comment.likes}
                          </button>
                          <button onClick={() => {
                            if (!isAuthenticated) return setIsAuthModalOpen(true);
                            setReplyingTo({id: comment.id, user: comment.user});
                          }}>Reply</button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Replies */}
                    {(comment.replies || []).length > 0 && (
                      <div className="ml-12 space-y-3 mt-2">
                        {comment.replies?.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <img
                              src={reply.avatar}
                              alt={reply.user}
                              className="w-7 h-7 rounded-full"
                            />
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold text-foreground">{reply.user}</span>
                                <span className="text-muted-foreground ml-2">{reply.text}</span>
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>1h</span>
                                <button 
                                  className={cn("flex items-center gap-1", reply.isLiked && "text-primary")}
                                  onClick={() => toggleCommentLike(reply.id, true, comment.id)}
                                >
                                  <Heart className={cn("w-3 h-3", reply.isLiked && "fill-primary")} />
                                  {reply.likes}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
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
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`}
                    alt="You"
                    className="w-9 h-9 rounded-full"
                  />
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                    className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  />
                  <Button
                    size="sm"
                    onClick={addComment}
                    disabled={!newComment.trim()}
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
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={shareTarget?.title ?? "Short"}
        url={shareTarget?.url}
      />
      {showAd && (
        <AdInterstitial
          onClose={() => setShowAd(false)}
          videoId={String(shortsData[activeIndex]?.id ?? activeIndex)}
        />
      )}

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
