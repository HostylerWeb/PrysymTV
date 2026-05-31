"use client"

import { use, useState, useEffect, useRef } from "react"
import { ChevronLeft, Share2, MoreVertical, Heart, Send, Users, Gift, Bell, BellOff, Volume2, VolumeX, Maximize, Lock, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AuthModal } from "@/components/auth-modal"
import { ReportModal } from "@/components/report-modal"
import { ShareSheet } from "@/components/share-sheet"
import { useAuth } from "@/contexts/auth-context"
import { getLiveStream, GIFT_CATALOG } from "@/lib/mock-data"

export default function LiveWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const stream = getLiveStream(id)
  const { user, isAuthenticated, updateCoins } = useAuth()
  const [chatMessages, setChatMessages] = useState([
    { id: "1", user: "GamerPro99", message: "This stream is amazing! 🔥", color: "text-cyan-400" },
  ])
  const [messageInput, setMessageInput] = useState("")
  const [showGiftPanel, setShowGiftPanel] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isNotifyOn, setIsNotifyOn] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [viewerCount, setViewerCount] = useState(stream.viewerCount)
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const userCoins = user?.coins || 0

  useEffect(() => {
    const interval = setInterval(() => setViewerCount((p) => p + Math.floor(Math.random() * 20) - 10), 5000)
    return () => clearInterval(interval)
  }, [])

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) setIsAuthModalOpen(true)
    else action()
  }

  const sendGift = (gift: (typeof GIFT_CATALOG)[number]) => {
    if (userCoins < gift.cost) return
    updateCoins(-gift.cost)
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), user: "You", message: `sent a ${gift.name} ${gift.icon}`, color: "text-primary" }])
    setShowGiftPanel(false)
  }

  return (
    <main className="h-[100dvh] bg-background flex flex-col pb-16 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="relative w-full aspect-video bg-black flex-shrink-0">
          <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover" />
          <div className="absolute top-0 left-0 right-0 flex justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <Link href="/"><button className="w-9 h-9 rounded-full bg-background/20 flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-white" /></button></Link>
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE</span>
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1"><Users className="w-3.5 h-3.5" />{viewerCount.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className="w-9 h-9 rounded-full bg-background/20 flex items-center justify-center">{isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}</button>
              <button onClick={() => setIsShareOpen(true)} className="w-9 h-9 rounded-full bg-background/20 flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></button>
              <button onClick={() => setIsReportOpen(true)} className="w-9 h-9 rounded-full bg-background/20 flex items-center justify-center"><Flag className="w-5 h-5 text-white" /></button>
              <button className="w-9 h-9 rounded-full bg-background/20 flex items-center justify-center"><Maximize className="w-5 h-5 text-white" /></button>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border">
          <h1 className="text-base font-semibold line-clamp-1">{stream.title}</h1>
          <p className="text-xs text-muted-foreground">{stream.category} · Started {stream.startedAgo}</p>
          <div className="flex items-center justify-between mt-3">
            <Link href={`/creator/${stream.streamerSlug}`} className="flex items-center gap-3">
              <img src={stream.streamerAvatar} alt="" className="w-11 h-11 rounded-full ring-2 ring-primary" />
              <div><h3 className="text-sm font-semibold">{stream.streamer}</h3><p className="text-xs text-muted-foreground">2.1M followers</p></div>
            </Link>
            <div className="flex gap-2">
              <button onClick={() => requireAuth(() => setIsNotifyOn(!isNotifyOn))} className={cn("w-10 h-10 rounded-full flex items-center justify-center", isNotifyOn ? "bg-primary text-white" : "bg-secondary")}>
                {isNotifyOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              <Button onClick={() => requireAuth(() => setIsFollowing(!isFollowing))} className={cn("rounded-full", isFollowing && "bg-secondary text-foreground")}>{isFollowing ? "Following" : "Follow"}</Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-[120px]">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2"><span className={cn("text-sm font-semibold", msg.color)}>{msg.user}:</span><span className="text-sm">{msg.message}</span></div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border">
            {isAuthenticated ? (
              <div className="flex gap-2">
                <button onClick={() => setShowGiftPanel(true)} className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center"><Gift className="w-5 h-5 text-white" /></button>
                <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && messageInput.trim() && (setChatMessages((p) => [...p, { id: Date.now().toString(), user: "You", message: messageInput, color: "text-primary" }]), setMessageInput(""))} placeholder="Say something..." className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm" />
                <button onClick={() => messageInput.trim() && (setChatMessages((p) => [...p, { id: Date.now().toString(), user: "You", message: messageInput, color: "text-primary" }]), setMessageInput(""))} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><Send className="w-4 h-4 text-white" /></button>
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="w-full py-3 rounded-full bg-secondary flex items-center justify-center gap-2 text-sm text-muted-foreground"><Lock className="w-4 h-4" /> Sign in to chat</button>
            )}
          </div>
        </div>

        {showGiftPanel && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowGiftPanel(false)}>
            <div className="absolute bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[450px] bg-background rounded-t-3xl md:rounded-3xl p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">Send a Gift</h3>
                <span>🪙 {userCoins.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {GIFT_CATALOG.map((gift) => (
                  <button key={gift.id} onClick={() => sendGift(gift)} disabled={userCoins < gift.cost} className={cn("flex flex-col items-center p-4 rounded-xl bg-secondary", userCoins < gift.cost && "opacity-50")}>
                    <span className="text-3xl">{gift.icon}</span>
                    <span className="text-sm font-medium">{gift.name}</span>
                    <span className="text-xs">🪙 {gift.cost}</span>
                  </button>
                ))}
              </div>
              <Link href="/profile"><Button variant="secondary" className="w-full rounded-full mt-4">Get More Coins</Button></Link>
            </div>
          </div>
        )}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} targetType="stream" targetLabel={stream.title} />
      <ShareSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title={stream.title} />
    </main>
  )
}
