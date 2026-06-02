"use client"

import { use, useState } from "react"
import { ChevronLeft, Play, Pause, Heart, Share2, Plus } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { getPodcastEpisode, getPodcastShow } from "@/lib/mock-data"

export default function PodcastEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const episode = getPodcastEpisode(id)
  const show = getPodcastShow(episode.showId)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [navTab, setNavTab] = useState("podcasts")

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/podcasts" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground"><ChevronLeft className="w-4 h-4" /> Back to Podcasts</Link>
        <img src={episode.cover} alt="" className="w-full max-w-sm aspect-square rounded-2xl object-cover mx-auto mb-6 shadow-xl" />
        <p className="text-sm text-primary font-medium text-center mb-1">{show.title}</p>
        <h1 className="text-2xl font-bold text-center mb-2">{episode.title}</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{episode.plays} plays · {episode.duration} · {episode.date}</p>
        <p className="text-sm text-foreground/80 mb-8">{episode.description}</p>
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          <button className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Heart className="w-5 h-5" /></button>
          <button className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Share2 className="w-5 h-5" /></button>
          <button className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"><Plus className="w-5 h-5" /></button>
        </div>
        <Link href={`/creator/${show.hostSlug}`} className="block p-4 rounded-xl bg-secondary/30 text-center text-sm">Hosted by {show.host}</Link>
      </div>
      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
