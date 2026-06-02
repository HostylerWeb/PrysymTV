"use client"

import { use, useState, useEffect } from "react"
import { ChevronLeft, Share2, MoreVertical, Play, Users, Video, Heart, Bell, BellOff, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"
import { ShareSheet } from "@/components/share-sheet"
import { useAuth } from "@/contexts/auth-context"
import { getCreator, mockPodcastEpisodes, mockPlaylists } from "@/lib/mock-data"
import {
  fetchCreatorVideos,
  fetchPublicProfile,
  followUser,
  unfollowUser,
  type PublicCreatorProfile,
} from "@/lib/api/users"
import { withApiFallback } from "@/lib/api/fallback"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"

type CreatorVideo = {
  id: string
  title: string
  thumbnail: string
  views: string
  duration: string
  type: string
}

export default function CreatorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const mock = getCreator(slug)
  const { isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<PublicCreatorProfile | null>(null)
  const [videos, setVideos] = useState<CreatorVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("videos")
  const [navTab, setNavTab] = useState("home")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [notificationsOn, setNotificationsOn] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const playlists = mockPlaylists.filter((p) => p.creatorSlug === mock.slug)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const p = await withApiFallback(
        () => fetchPublicProfile(slug),
        null as PublicCreatorProfile | null,
      )
      const v = await withApiFallback(
        () => fetchCreatorVideos(slug),
        { items: [], meta: { page: 1, limit: 24, total: 0 } },
      )
      if (cancelled) return
      setProfile(p)
      setVideos(
        v.items.map((item) => ({
          id: item.id,
          title: item.title,
          thumbnail: videoThumbnail(item.thumbnailUrl),
          views: formatViewCount(item.viewsCount),
          duration: formatDuration(item.durationSeconds),
          type: item.type,
        })),
      )
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  const name = profile?.displayName ?? mock.name
  const username = profile ? `@${profile.username}` : mock.username
  const avatar =
    profile?.avatarUrl ??
    mock.avatar
  const banner = profile?.bannerUrl ?? mock.banner
  const bio = profile?.bio ?? mock.bio
  const subscribers = profile
    ? formatViewCount(profile.followersCount)
    : mock.subscribers
  const videosCount = profile ? String(profile.videosCount) : mock.videosCount
  const isVerified = profile?.isVerified ?? mock.isVerified
  const isLive = profile?.isLive ?? mock.isLive
  const liveSlug = profile?.username ?? mock.slug
  const links =
    profile?.socialLinks?.map((l) => ({ label: l.label, url: l.url })) ?? mock.links

  const shortsList = videos.filter((v) => v.type === "short")
  const longVideos = videos.filter((v) => v.type !== "short")

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    action()
  }

  const handleSubscribe = () => {
    requireAuth(() => {
      const username = profile?.username ?? slug
      const next = !isSubscribed
      void (next ? followUser(username) : unfollowUser(username))
        .then(() => setIsSubscribed(next))
        .catch(() => setIsSubscribed(next))
    })
  }

  const handleNotifyToggle = () => {
    requireAuth(() => setNotificationsOn((prev) => !prev))
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background md:pl-20">
        <p className="text-muted-foreground">Loading creator…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        <div className="relative w-full h-32 md:h-64 md:mt-4 md:rounded-2xl overflow-hidden">
          <img src={banner} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute top-0 left-0 right-0 flex justify-between p-4">
            <Link href="/"><button type="button" className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center"><ChevronLeft className="w-6 h-6 text-white" /></button></Link>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsShareOpen(true)} className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center"><Share2 className="w-5 h-5 text-white" /></button>
              <button type="button" className="w-10 h-10 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center"><MoreVertical className="w-5 h-5 text-white" /></button>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 -mt-10 md:-mt-16 relative z-10 flex flex-col md:flex-row md:items-end gap-4 mb-8">
          <img src={avatar} alt={name} className="w-20 h-20 md:w-32 md:h-32 rounded-full ring-4 ring-background object-cover" />
          <div className="flex-1 md:pb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-3xl font-bold">{name}</h1>
              {isVerified && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
              {isLive && <Link href={`/live/${liveSlug}`} className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-bold">LIVE</Link>}
            </div>
            <p className="text-muted-foreground">{username}</p>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{subscribers} subscribers</span>
              <span className="flex items-center gap-1"><Video className="w-4 h-4" />{videosCount} videos</span>
            </div>
          </div>
          <div className="flex gap-3 md:pb-2">
            <Button onClick={handleSubscribe} className={cn("flex-1 md:w-32 rounded-full", isSubscribed && "bg-secondary text-foreground")}>{isSubscribed ? "Subscribed" : "Subscribe"}</Button>
            {isSubscribed && (
              <Button variant="secondary" size="icon" className="rounded-full" onClick={handleNotifyToggle}>
                {notificationsOn ? <Bell className="w-5 h-5 fill-current" /> : <BellOff className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 md:px-8 mb-8 md:max-w-3xl">
          <p className="text-sm md:text-base text-foreground/80 mb-4">{bio}</p>
          <div className="flex gap-2 overflow-x-auto">
            {links.map((l) => (
              <a key={l.label} href={l.url} className="px-4 py-1.5 rounded-full bg-secondary text-sm whitespace-nowrap">{l.label}</a>
            ))}
          </div>
        </div>

        <div className="border-b border-border px-4 md:px-8 flex gap-6 overflow-x-auto">
          {["videos", "shorts", "live", "podcasts", "playlists"].map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={cn("py-4 text-sm font-medium capitalize border-b-2 -mb-px whitespace-nowrap", activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>{tab}</button>
          ))}
        </div>

        <div className="px-4 md:px-8 py-6">
          {activeTab === "videos" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(longVideos.length ? longVideos : videos).map((v) => (
                <Link key={v.id} href={`/watch/${v.id}`} className="group">
                  <div className="aspect-video rounded-xl overflow-hidden mb-2 relative">
                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">{v.duration}</span>
                  </div>
                  <h3 className="text-sm font-semibold line-clamp-2">{v.title}</h3>
                  <p className="text-xs text-muted-foreground">{v.views} views</p>
                </Link>
              ))}
              {videos.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full py-8 text-center">No videos yet.</p>
              )}
            </div>
          )}
          {activeTab === "shorts" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(shortsList.length ? shortsList : videos).map((v) => (
                <Link key={v.id} href={`/watch/${v.id}`} className="aspect-[9/16] rounded-xl overflow-hidden relative">
                  <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                  <Play className="absolute bottom-3 left-3 w-4 h-4 text-white fill-white" />
                </Link>
              ))}
              {videos.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full py-8 text-center">No shorts yet.</p>
              )}
            </div>
          )}
          {activeTab === "live" && isLive ? (
            <Link href={`/live/${liveSlug}`} className="block p-6 rounded-2xl bg-primary/10 border border-primary/30 text-center">
              <p className="font-bold text-primary mb-2">Live now</p>
              <Button className="rounded-full">Join Stream</Button>
            </Link>
          ) : activeTab === "live" ? (
            <div className="text-center py-20 text-muted-foreground">No live streams right now. Enable notifications to get alerted.</div>
          ) : null}
          {activeTab === "podcasts" && (
            <div className="space-y-3">
              {mockPodcastEpisodes.map((ep) => (
                <Link key={ep.id} href={`/podcast/${ep.id}`} className="flex gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60">
                  <img src={ep.cover} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <div><h3 className="font-semibold text-sm">{ep.title}</h3><p className="text-xs text-muted-foreground">{ep.plays} plays</p></div>
                </Link>
              ))}
            </div>
          )}
          {activeTab === "playlists" && (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {playlists.map((pl) => (
                <Link key={pl.id} href={`/playlist/${pl.id}`} className="group">
                  <div className="aspect-video rounded-xl overflow-hidden mb-2"><img src={pl.cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                  <h3 className="font-semibold text-sm">{pl.title}</h3>
                  <p className="text-xs text-muted-foreground">{pl.itemCount} items</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode="login" />
      <ShareSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title={name} />
    </main>
  )
}
