"use client"

import { use, useState } from "react"
import { ChevronLeft, Play, Grid3X3 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { getPlaylist, getVideo, getPodcastEpisode } from "@/lib/mock-data"

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const playlist = getPlaylist(id)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [navTab, setNavTab] = useState("home")

  const items = playlist.itemIds.map((itemId) => {
    if (playlist.type === "podcast") {
      const ep = getPodcastEpisode(itemId)
      return { id: itemId, title: ep.title, subtitle: ep.podcast, href: `/podcast/${itemId}`, cover: ep.cover }
    }
    const v = getVideo(itemId)
    return { id: itemId, title: v.title, subtitle: v.channel, href: `/watch/${itemId}`, cover: v.thumbnail }
  })

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={`/creator/${playlist.creatorSlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"><ChevronLeft className="w-4 h-4" /> Back to channel</Link>
        <div className="flex gap-4 mb-8">
          <img src={playlist.cover} alt="" className="w-32 h-32 rounded-xl object-cover" />
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1"><Grid3X3 className="w-4 h-4" /> Playlist</div>
            <h1 className="text-2xl font-bold mb-2">{playlist.title}</h1>
            <p className="text-sm text-muted-foreground mb-2">{playlist.itemCount} items</p>
            <p className="text-sm text-foreground/80">{playlist.description}</p>
          </div>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <Link key={item.id} href={item.href} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50">
              <span className="w-6 text-center text-muted-foreground text-sm">{i + 1}</span>
              <img src={item.cover} alt="" className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0"><p className="font-medium text-sm line-clamp-1">{item.title}</p><p className="text-xs text-muted-foreground">{item.subtitle}</p></div>
              <Play className="w-4 h-4 text-primary" />
            </Link>
          ))}
        </div>
      </div>
      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
