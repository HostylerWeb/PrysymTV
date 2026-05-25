"use client"

import { useState, useRef } from "react"
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Heart,
  Share2, MoreHorizontal, Mic, Clock, Users, TrendingUp,
  Shuffle, Repeat, Plus, Search as SearchIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// ─── DATA ────────────────────────────────────────────────────────────────────

const categories = ["All", "True Crime", "Tech", "Business", "Comedy", "Health", "Society", "Science", "Sports", "Music"]

const featuredPodcast = {
  id: "1",
  title: "The Tech Horizon",
  host: "Alex Rivera",
  cover: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=800&fit=crop",
  banner: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600&h=600&fit=crop&crop=top",
  category: "Tech",
  episodes: 248,
  followers: "1.2M",
  latestEpisode: "AI & The Future of Work: What Nobody Is Telling You",
  latestDuration: "1h 14m",
  description: "Weekly deep-dives into the technologies reshaping our world. From AI breakthroughs to startup culture — unfiltered conversations with the people building tomorrow.",
}

const trendingShows = [
  { id: "1", title: "Crime & Consequence", host: "Sarah Mitchell", cover: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop", category: "True Crime", followers: "890K", episodes: 312 },
  { id: "2", title: "Founders Mindset", host: "James Kim", cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop", category: "Business", followers: "645K", episodes: 187 },
  { id: "3", title: "Laugh Therapy", host: "Maria Santos", cover: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=400&fit=crop", category: "Comedy", followers: "2.1M", episodes: 430 },
  { id: "4", title: "Mind & Body Lab", host: "Dr. Priya Nair", cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop", category: "Health", followers: "1.4M", episodes: 201 },
  { id: "5", title: "Deep Space Weekly", host: "Tom Yates", cover: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop", category: "Science", followers: "520K", episodes: 98 },
  { id: "6", title: "The Money Code", host: "Lisa Chen", cover: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop", category: "Business", followers: "780K", episodes: 155 },
]

const latestEpisodes = [
  { id: "1", podcast: "Crime & Consequence", title: "The Vanishing: A 30-Year Cold Case Solved", duration: "58m", date: "Today", cover: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop", plays: "142K" },
  { id: "2", podcast: "Founders Mindset", title: "How I Built a $50M Company From My Garage", duration: "1h 22m", date: "Yesterday", cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop", plays: "87K" },
  { id: "3", podcast: "The Tech Horizon", title: "AI & The Future of Work", duration: "1h 14m", date: "2 days ago", cover: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop", plays: "310K" },
  { id: "4", podcast: "Laugh Therapy", title: "Dating Apps in 2025: A Comedy Special", duration: "44m", date: "3 days ago", cover: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=100&h=100&fit=crop", plays: "420K" },
  { id: "5", podcast: "Mind & Body Lab", title: "Sleep Optimization: The Science You Need", duration: "51m", date: "4 days ago", cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop", plays: "98K" },
  { id: "6", podcast: "Deep Space Weekly", title: "James Webb's Latest: What We Found", duration: "1h 5m", date: "5 days ago", cover: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=100&h=100&fit=crop", plays: "65K" },
]

const topCreators = [
  { id: "1", name: "Alex Rivera", handle: "@alexrivera", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", shows: 2, followers: "1.8M", isVerified: true },
  { id: "2", name: "Sarah Mitchell", handle: "@sarahmitch", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", shows: 1, followers: "890K", isVerified: true },
  { id: "3", name: "James Kim", handle: "@jameskim", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", shows: 3, followers: "645K", isVerified: false },
  { id: "4", name: "Dr. Priya Nair", handle: "@drpriya", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", shows: 1, followers: "1.4M", isVerified: true },
  { id: "5", name: "Maria Santos", handle: "@mariasantos", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", shows: 2, followers: "2.1M", isVerified: true },
]

// ─── MINI AUDIO PLAYER BAR ─────────────────────────────────────────────────

function PlayerBar({ episode, onClose }: { episode: typeof latestEpisodes[0], onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(34)
  const [liked, setLiked] = useState(false)

  return (
    <div className="fixed bottom-16 md:bottom-0 md:left-20 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
      {/* Progress bar */}
      <div className="w-full h-0.5 bg-border">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Cover */}
        <img src={episode.cover} alt={episode.podcast} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{episode.title}</p>
          <p className="text-xs text-muted-foreground truncate">{episode.podcast}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLiked(!liked)}
            className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", liked ? "text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-primary")} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <SkipForward className="w-4 h-4" />
          </button>
          <button className="hidden md:flex w-8 h-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ──────────────────────────────────────────────────────────────────

export default function PodcastsPage() {
  const [activeTab, setActiveTab] = useState("podcasts")
  const [activeCategory, setActiveCategory] = useState("All")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<typeof latestEpisodes[0] | null>(null)
  const [likedEpisodes, setLikedEpisodes] = useState<Set<string>>(new Set())

  const toggleLike = (id: string) => {
    setLikedEpisodes(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredShows = activeCategory === "All"
    ? trendingShows
    : trendingShows.filter(s => s.category === activeCategory)

  return (
    <main className="min-h-screen bg-background pb-32 md:pb-20 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div className="relative w-full h-72 md:h-[420px] overflow-hidden">
        <img
          src={featuredPodcast.banner}
          alt={featuredPodcast.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-end md:items-center">
          <div className="px-4 md:px-10 pb-6 md:pb-0 flex gap-5 items-end md:items-center max-w-3xl">
            <img
              src={featuredPodcast.cover}
              alt={featuredPodcast.title}
              className="w-20 h-20 md:w-32 md:h-32 rounded-2xl object-cover shadow-2xl flex-shrink-0 border-2 border-primary/40"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-white uppercase tracking-wider">Featured</span>
                <span className="text-xs text-muted-foreground">{featuredPodcast.category}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight mb-1">{featuredPodcast.title}</h1>
              <p className="text-sm text-muted-foreground mb-2 hidden md:block">{featuredPodcast.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> {featuredPodcast.host}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {featuredPodcast.followers}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {featuredPodcast.episodes} episodes</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNowPlaying(latestEpisodes[2])}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" /> Play Latest
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold rounded-full hover:bg-secondary/80 transition-all">
                  <Plus className="w-4 h-4" /> Follow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">

        {/* ── CATEGORY FILTER ─────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
                activeCategory === cat
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── TRENDING SHOWS GRID ──────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trending Shows
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredShows.map(show => (
              <div key={show.id} className="group cursor-pointer">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-lg">
                  <img
                    src={show.cover}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <button
                      onClick={() => setNowPlaying(latestEpisodes[0])}
                      className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 text-xs bg-black/70 backdrop-blur-md text-white px-2 py-0.5 rounded-full font-medium">
                    {show.category}
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{show.title}</p>
                <p className="text-xs text-muted-foreground">{show.host}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{show.followers} followers</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN 2-COLUMN LAYOUT ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Latest Episodes (left/wide) */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground mb-4">Latest Episodes</h2>
            <div className="space-y-2">
              {latestEpisodes.map((ep, i) => (
                <div
                  key={ep.id}
                  onClick={() => setNowPlaying(ep)}
                  className={cn(
                    "group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-200",
                    nowPlaying?.id === ep.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/30 hover:bg-secondary/60"
                  )}
                >
                  {/* Index / Playing indicator */}
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {nowPlaying?.id === ep.id ? (
                      <span className="flex gap-0.5 items-end h-4">
                        <span className="w-0.5 bg-primary rounded-full animate-bounce h-3" style={{ animationDelay: "0ms" }} />
                        <span className="w-0.5 bg-primary rounded-full animate-bounce h-4" style={{ animationDelay: "150ms" }} />
                        <span className="w-0.5 bg-primary rounded-full animate-bounce h-2" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground group-hover:hidden">{i + 1}</span>
                    )}
                    {nowPlaying?.id !== ep.id && (
                      <Play className="w-4 h-4 text-primary hidden group-hover:block fill-primary" />
                    )}
                  </div>

                  {/* Cover */}
                  <img src={ep.cover} alt={ep.podcast} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">{ep.podcast} · {ep.date}</p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{ep.plays} plays</span>
                    <button
                      onClick={e => { e.stopPropagation(); toggleLike(ep.id) }}
                      className={cn("w-8 h-8 flex items-center justify-center rounded-full transition-colors", likedEpisodes.has(ep.id) ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                      <Heart className={cn("w-4 h-4", likedEpisodes.has(ep.id) && "fill-primary")} />
                    </button>
                    <span className="text-xs text-muted-foreground w-10 text-right">{ep.duration}</span>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">

            {/* Top Creators */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Top Creators</h2>
              <div className="space-y-3">
                {topCreators.map((creator, i) => (
                  <div key={creator.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors cursor-pointer group">
                    <span className="text-sm font-black text-muted-foreground w-5 text-center">{i + 1}</span>
                    <div className="relative">
                      <img src={creator.avatar} alt={creator.name} className="w-10 h-10 rounded-full object-cover" />
                      {creator.isVerified && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="currentColor"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{creator.name}</p>
                      <p className="text-xs text-muted-foreground">{creator.followers} followers</p>
                    </div>
                    <button className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Playlist */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Curated Playlists</h2>
              <div className="space-y-3">
                {[
                  { name: "Deep Work Sessions", count: 18, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop" },
                  { name: "Morning Motivation", count: 24, img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop" },
                  { name: "Tech Founders Only", count: 31, img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop" },
                ].map((pl) => (
                  <div key={pl.name} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors cursor-pointer group">
                    <img src={pl.img} alt={pl.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{pl.name}</p>
                      <p className="text-xs text-muted-foreground">{pl.count} episodes</p>
                    </div>
                    <Play className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />

      {/* ── AUDIO PLAYER BAR ───────────────────────────────────────────────── */}
      {nowPlaying && (
        <PlayerBar episode={nowPlaying} onClose={() => setNowPlaying(null)} />
      )}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          if (tab === "home") window.location.href = "/"
          if (tab === "movies") window.location.href = "/movies"
          if (tab === "shorts") window.location.href = "/shorts"
          if (tab === "profile") window.location.href = "/profile"
        }}
        onSearchClick={() => setIsSearchOpen(true)}
      />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
