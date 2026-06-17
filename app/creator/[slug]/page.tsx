"use client"

import { Suspense, use, useState, useEffect } from "react"
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
import {
  fetchCreatorVideos,
  fetchPublicProfile,
  followUser,
  unfollowUser,
  toggleCreatorLiveAlerts,
  type PublicCreatorProfile,
} from "@/lib/api/users"
import { fetchPodcastShows } from "@/lib/api/podcasts"
import { fetchCreatorPlaylists } from "@/lib/api/playlists"
import { formatDuration, formatViewCount, videoThumbnail } from "@/lib/format-media"
import { userAvatarUrl } from "@/lib/user-avatar"

type CreatorVideo = {
  id: string
  title: string
  thumbnail: string
  views: string
  duration: string
  type: string
}

export default function CreatorProfilePage(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background md:pl-20">
          <p className="text-muted-foreground">Loading creator…</p>
        </main>
      }
    >
      <CreatorProfilePageContent {...props} />
    </Suspense>
  )
}

function CreatorProfilePageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { isAuthenticated } = useAuth()
  const [profile, setProfile] = useState<PublicCreatorProfile | null>(null)
  const [videos, setVideos] = useState<CreatorVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("videos")
  const [navTab, setNavTab] = useState("home")
  const [isFollowing, setIsFollowing] = useState(false)
  const [notificationsOn, setNotificationsOn] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [podcastShows, setPodcastShows] = useState<
    Array<{ id: string; title: string; cover: string; episodes: number }>
  >([])
  const [playlists, setPlaylists] = useState<
    Array<{ id: string; title: string; coverUrl: string | null; itemCount: number }>
  >([])
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      let p: PublicCreatorProfile | null = null
      let v = { items: [] as Awaited<ReturnType<typeof fetchCreatorVideos>>["items"], meta: { page: 1, limit: 24, total: 0 } }
      try {
        p = await fetchPublicProfile(slug)
      } catch {
        p = null
      }
      try {
        const videosRes = await fetchCreatorVideos(slug)
        v = videosRes
      } catch {
        /* empty videos */
      }
      if (cancelled) return
      setProfile(p)
      setIsFollowing(p?.isFollowing ?? false)
      setNotificationsOn(p?.liveAlertsOn ?? false)
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
      if (p) {
        void fetchPodcastShows(1, 50)
          .then((shows) =>
            setPodcastShows(
              shows.items
                .filter((s) => s.hostSlug === p.username)
                .map((s) => ({
                  id: s.id,
                  title: s.title,
                  cover: s.cover,
                  episodes: s.episodes,
                })),
            ),
          )
          .catch(() => setPodcastShows([]))
        void fetchCreatorPlaylists(slug)
          .then((res) => setPlaylists(res.items))
          .catch(() => setPlaylists([]))
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background md:pl-20">
        <p className="text-muted-foreground">Loading creator…</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 bg-background md:pl-20">
        <p className="text-muted-foreground">Creator not found.</p>
        <Link href="/">
          <Button variant="secondary" className="rounded-full">
            Back to home
          </Button>
        </Link>
      </main>
    )
  }

  const name = profile.displayName ?? slug
  const username = `@${profile.username}`
  const avatar = userAvatarUrl(profile.avatarUrl, slug)
  const banner = profile.bannerUrl?.trim() || null
  const bio = profile.bio ?? ""
  const subscribers = formatViewCount(profile.followersCount)
  const videosCount = String(profile.videosCount)
  const isVerified = profile.isVerified
  const isLive = profile.isLive
  const liveSlug = profile.username
  const links = profile.socialLinks?.map((l) => ({ label: l.label, url: l.url })) ?? []

  const shortsList = videos.filter((v) => v.type === "short")
  const longVideos = videos.filter((v) => v.type !== "short")

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    action()
  }

  const handleFollow = () => {
    requireAuth(() => {
      const username = profile.username
      const next = !isFollowing
      void (next ? followUser(username) : unfollowUser(username))
        .then(() => setIsFollowing(next))
        .catch(() => setIsFollowing(next))
    })
  }

  const handleNotifyToggle = () => {
    requireAuth(() => {
      void toggleCreatorLiveAlerts(profile.username)
        .then((r) => setNotificationsOn(r.enabled))
        .catch(() => setNotificationsOn((prev) => !prev))
    })
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto w-full">
        <div className="relative w-full h-32 md:h-64 md:mt-4 md:rounded-2xl overflow-hidden bg-gradient-to-br from-primary/25 via-secondary to-background">
          {banner ? (
            <img src={banner} alt="" className="w-full h-full object-cover" />
          ) : null}
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
          <div className="flex flex-wrap gap-2 md:pb-2">
            <Button
              onClick={handleFollow}
              variant={isFollowing ? "secondary" : "default"}
              className="rounded-full"
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            {isFollowing && (
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
            podcastShows.length === 0 ? (
              <p className="text-center py-20 text-muted-foreground text-sm">
                No podcast shows from this creator yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {podcastShows.map((show) => (
                  <Link
                    key={show.id}
                    href="/podcasts"
                    className="flex gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/60"
                  >
                    <img
                      src={videoThumbnail(show.cover)}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-sm">{show.title}</h3>
                      <p className="text-xs text-muted-foreground">{show.episodes} episodes</p>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
          {activeTab === "playlists" && (
            playlists.length === 0 ? (
              <p className="text-center py-20 text-muted-foreground text-sm">
                No public playlists yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {playlists.map((pl) => (
                  <Link key={pl.id} href={`/playlist/${pl.id}`} className="group">
                    <div className="aspect-video rounded-xl overflow-hidden mb-2 bg-secondary">
                      <img
                        src={videoThumbnail(pl.coverUrl)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="font-semibold text-sm">{pl.title}</h3>
                    <p className="text-xs text-muted-foreground">{pl.itemCount} items</p>
                  </Link>
                ))}
              </div>
            )
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
