"use client"

import { useState, useEffect, useRef } from "react"
import { 
  ChevronLeft, 
  Share2, 
  MoreVertical, 
  Heart,
  Send,
  Users,
  Gift,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { CoinsModal } from "@/components/coins-modal"
import { useAuth } from "@/contexts/auth-context"

// Gift definitions with coins cost
const gifts = [
  { id: "heart", name: "Heart", icon: "❤️", cost: 10, color: "from-pink-500 to-rose-500" },
  { id: "star", name: "Star", icon: "⭐", cost: 50, color: "from-yellow-400 to-amber-500" },
  { id: "diamond", name: "Diamond", icon: "💎", cost: 100, color: "from-cyan-400 to-blue-500" },
  { id: "rocket", name: "Rocket", icon: "🚀", cost: 200, color: "from-orange-500 to-red-500" },
  { id: "crown", name: "Crown", icon: "👑", cost: 500, color: "from-yellow-500 to-amber-600" },
  { id: "fire", name: "Fire", icon: "🔥", cost: 1000, color: "from-orange-600 to-red-600" },
]

// Mock live chat messages
const initialMessages = [
  { id: "1", user: "GamerPro99", message: "This stream is amazing! 🔥", color: "text-cyan-400" },
  { id: "2", user: "StreamFan", message: "First time here, love it!", color: "text-green-400" },
  { id: "3", user: "NightOwl", message: "Can you play that song again?", color: "text-purple-400" },
  { id: "4", user: "TechLover", message: "The quality is insane", color: "text-yellow-400" },
  { id: "5", user: "MusicVibes", message: "Vibing with everyone here 🎵", color: "text-pink-400" },
]

const newMessages = [
  { user: "CoolKid123", message: "Just joined! What did I miss?", color: "text-blue-400" },
  { user: "StreamQueen", message: "Love the energy tonight!", color: "text-rose-400" },
  { user: "NeonDreamer", message: "Best streamer ever! 💜", color: "text-violet-400" },
  { user: "GalaxyRider", message: "Sending good vibes ✨", color: "text-emerald-400" },
  { user: "CyberNinja", message: "This is legendary content", color: "text-orange-400" },
]

interface GiftAnimation {
  id: string
  gift: typeof gifts[0]
  user: string
}

export default function LiveWatchPage() {
  const { user, isAuthenticated, updateCoins } = useAuth()
  const [chatMessages, setChatMessages] = useState(initialMessages)
  const [messageInput, setMessageInput] = useState("")
  const [showGiftPanel, setShowGiftPanel] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isNotifyOn, setIsNotifyOn] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [viewerCount, setViewerCount] = useState(15234)
  const [giftAnimations, setGiftAnimations] = useState<GiftAnimation[]>([])
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const userCoins = user?.coins || 0

  // Simulate live chat
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessage = newMessages[Math.floor(Math.random() * newMessages.length)]
      const newMsg = {
        id: Date.now().toString(),
        ...randomMessage
      }
      setChatMessages(prev => [...prev.slice(-20), newMsg])
      
      // Random viewer count fluctuation
      setViewerCount(prev => prev + Math.floor(Math.random() * 20) - 10)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [chatMessages])

  const sendMessage = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    if (!messageInput.trim()) return
    const newMsg = {
      id: Date.now().toString(),
      user: "You",
      message: messageInput,
      color: "text-primary"
    }
    setChatMessages(prev => [...prev, newMsg])
    setMessageInput("")
  }

  const handleOpenGiftPanel = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setShowGiftPanel(!showGiftPanel)
  }

  const sendGift = (gift: typeof gifts[0]) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    if (userCoins < gift.cost) return
    
    updateCoins(-gift.cost)
    
    // Add gift animation
    const animation: GiftAnimation = {
      id: Date.now().toString(),
      gift,
      user: "You"
    }
    setGiftAnimations(prev => [...prev, animation])
    
    // Add to chat
    const giftMsg = {
      id: Date.now().toString(),
      user: "You",
      message: `sent a ${gift.name} ${gift.icon}`,
      color: "text-primary",
    }
    setChatMessages(prev => [...prev, giftMsg])
    
    // Remove animation after 3 seconds
    setTimeout(() => {
      setGiftAnimations(prev => prev.filter(a => a.id !== animation.id))
    }, 3000)
    
    setShowGiftPanel(false)
  }

  const handleFollow = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsFollowing(!isFollowing)
  }

  const handleNotify = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsNotifyOn(!isNotifyOn)
  }

  return (
    <main className="h-[100dvh] bg-background flex flex-col pb-16 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0 relative">
      {/* Video Player - Fixed aspect ratio */}
      <div className="relative w-full aspect-video bg-black flex-shrink-0 md:rounded-b-2xl overflow-hidden shadow-xl">
        {/* Video thumbnail/stream */}
        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop"
          alt="Live stream"
          className="w-full h-full object-cover"
        />
        
        {/* Live indicator overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <Link href="/">
              <button className="w-9 h-9 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {viewerCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
            <button className="w-9 h-9 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </button>
            <button className="w-9 h-9 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Gift animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {giftAnimations.map((anim) => (
            <div
              key={anim.id}
              className="absolute bottom-20 left-4 animate-bounce"
            >
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r shadow-lg",
                anim.gift.color
              )}>
                <span className="text-2xl">{anim.gift.icon}</span>
                <span className="text-white font-bold text-sm">{anim.user} sent {anim.gift.name}!</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stream Info */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground line-clamp-1 mb-1">
              Late Night Gaming Session - Playing New Release!
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Gaming</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>Started 2h ago</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <Share2 className="w-4 h-4 text-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <MoreVertical className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Streamer Info */}
        <div className="flex items-center justify-between mt-3">
          <Link href="/creator/progamerx" className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
                alt="Streamer"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-primary"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">ProGamerX</h3>
              <p className="text-xs text-muted-foreground">2.1M followers</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleNotify}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isNotifyOn ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              )}
            >
              {isNotifyOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            <Button 
              onClick={handleFollow}
              className={cn(
                "rounded-full",
                isFollowing && "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Live Chat</h3>
          <span className="text-xs text-muted-foreground">{chatMessages.length} messages</span>
        </div>
        
        {/* Chat messages */}
        <div 
          ref={chatRef}
          className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-[200px] max-h-[300px]"
        >
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2">
              <span className={cn("text-sm font-semibold", msg.color)}>{msg.user}:</span>
              <span className="text-sm text-foreground/90">{msg.message}</span>
            </div>
          ))}
        </div>

        {/* Chat input */}
        <div className="px-4 py-3 border-t border-border bg-background">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleOpenGiftPanel}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0"
              >
                <Gift className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full px-4">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Say something..."
                  className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {messageInput && (
                  <button 
                    onClick={sendMessage}
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sign in to chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Gift Panel */}
      {showGiftPanel && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowGiftPanel(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] md:bottom-auto bg-background rounded-t-3xl md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-border">
              <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-4 md:hidden" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Send a Gift</h3>
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-3 py-1.5 rounded-full">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-bold text-foreground">{userCoins.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 p-4">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => sendGift(gift)}
                  disabled={userCoins < gift.cost}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                    userCoins >= gift.cost 
                      ? "bg-secondary hover:bg-secondary/80 hover:scale-105" 
                      : "bg-muted opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-4xl">{gift.icon}</span>
                  <span className="text-sm font-medium text-foreground">{gift.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">🪙</span>
                    <span className="text-xs font-bold text-muted-foreground">{gift.cost}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-4 pb-8">
              <Link href="/profile">
                <Button variant="secondary" className="w-full rounded-full gap-2">
                  <span>🪙</span>
                  Get More Coins
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

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
