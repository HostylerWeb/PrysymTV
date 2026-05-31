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
import { mockShorts } from "@/lib/mock-data"

// Sample shorts data
const shortsData = mockShorts

interface ShortVideoProps {
  short: typeof shortsData[0]
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
      <video
        ref={videoRef}
        src={short.videoUrl}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

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

        {/* Music Disc */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 flex items-center justify-center animate-spin-slow">
          <div className="w-3 h-3 rounded-full bg-white" />
        </div>
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedShorts, setLikedShorts] = useState<Set<number>>(new Set())
  const [savedShorts, setSavedShorts] = useState<Set<number>>(new Set())
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set(
    shortsData.filter(s => s.isFollowing).map(s => s.username)
  ))
  const [showComments, setShowComments] = useState(false)
  const [activeShortForComments, setActiveShortForComments] = useState<number | null>(null)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<{id: number, user: string} | null>(null)

  type CommentType = {id: number, user: string, text: string, likes: number, avatar: string, isLiked?: boolean, replies?: CommentType[]}
  const [comments, setComments] = useState<{[key: number]: CommentType[]}>({
    1: [
      { id: 1, user: "@gamer123", text: "That was insane! How did you do that?!", likes: 234, avatar: "https://api.dicebear.com/7.x/initials/svg?seed=G1", replies: [] },
      { id: 2, user: "@noob_player", text: "Teach me your ways master", likes: 89, avatar: "https://api.dicebear.com/7.x/initials/svg?seed=NP", replies: [] },
    ],
    2: [
      { id: 1, user: "@wanderlust", text: "Where is this?? I need to go!", likes: 567, avatar: "https://api.dicebear.com/7.x/initials/svg?seed=WL", replies: [] },
    ],
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState("shorts")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showAd, setShowAd] = useState(false)
  const shortsViewCount = useRef(0)

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

  const toggleLike = (shortId: number) => {
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

  const toggleSave = (shortId: number) => {
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

  const openComments = (shortId: number) => {
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
              onShare={() => {}}
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
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {showAd && <AdInterstitial onClose={() => setShowAd(false)} />}

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
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
