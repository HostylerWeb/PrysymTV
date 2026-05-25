"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { FeaturedLive } from "@/components/featured-live"
import { CategoryTabs } from "@/components/category-tabs"
import { StoriesRow } from "@/components/stories-row"
import { ContentRow } from "@/components/content-row"
import { MovieRow } from "@/components/movie-row"
import { LiveRow } from "@/components/live-row"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Footer } from "@/components/footer"

// Mock data
const stories = [
  { id: "1", name: "Alex Gaming", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", isLive: true },
  { id: "2", name: "Sarah", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", hasNew: true },
  { id: "3", name: "Mike", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", hasNew: true },
  { id: "4", name: "Emma", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: "5", name: "John", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", hasNew: true },
  { id: "6", name: "Lisa", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
]

const continueWatching = [
  { id: "1", title: "Stranger Things - Season 4", thumbnail: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=600&h=340&fit=crop", duration: "55:23", progress: 65, type: "video" as const },
  { id: "2", title: "The Dark Knight Returns", thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=340&fit=crop", duration: "2:32:15", progress: 30, type: "movie" as const },
  { id: "3", title: "Breaking Bad - S5E12", thumbnail: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=340&fit=crop", duration: "47:18", progress: 80, type: "video" as const },
]

const trendingVideos = [
  { id: "1", title: "Building a $1M Business in 30 Days Challenge", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=340&fit=crop", duration: "24:15", views: "2.3M", channel: "Business Minds", type: "video" as const },
  { id: "2", title: "Ultimate Guide to Minimalist Living", thumbnail: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=340&fit=crop", duration: "18:42", views: "890K", channel: "Simple Life", type: "video" as const },
  { id: "3", title: "Epic Mountain Bike Trail POV", thumbnail: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&h=340&fit=crop", duration: "12:33", views: "1.5M", channel: "Adventure Sports", type: "video" as const },
  { id: "4", title: "Cooking Perfect Steak Every Time", thumbnail: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=340&fit=crop", duration: "15:20", views: "3.1M", channel: "Chef Pro", type: "video" as const },
]

const topMovies = [
  { id: "1", title: "Interstellar", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=450&fit=crop", year: "2024", rating: 8.9, genre: "Sci-Fi" },
  { id: "2", title: "The Last Kingdom", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=450&fit=crop", year: "2024", rating: 8.5, genre: "Action" },
  { id: "3", title: "Ocean Deep", poster: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=300&h=450&fit=crop", year: "2024", rating: 7.8, genre: "Adventure" },
  { id: "4", title: "City Lights", poster: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&h=450&fit=crop", year: "2023", rating: 8.2, genre: "Drama" },
  { id: "5", title: "Northern Winds", poster: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=450&fit=crop", year: "2024", rating: 8.7, genre: "Thriller" },
  { id: "6", title: "Desert Storm", poster: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=300&h=450&fit=crop", year: "2024", rating: 7.9, genre: "Action" },
]

const liveStreams = [
  { id: "1", title: "Day 100 of the Ultimate Challenge!", thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=340&fit=crop", streamer: "ProGamerX", viewers: "24.5K", category: "Gaming" },
  { id: "2", title: "Chill Music & Chat | Late Night Vibes", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=340&fit=crop", streamer: "DJ_Nova", viewers: "8.2K", category: "Music" },
  { id: "3", title: "Live Coding: Building a SaaS from Scratch", thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=340&fit=crop", streamer: "CodeWithMe", viewers: "5.1K", category: "Technology" },
  { id: "4", title: "Morning Yoga Flow | All Levels Welcome", thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=340&fit=crop", streamer: "ZenMaster", viewers: "3.8K", category: "Fitness" },
]

const newReleases = [
  { id: "1", title: "Echoes of Tomorrow", poster: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop", year: "2024", rating: 8.1, genre: "Sci-Fi" },
  { id: "2", title: "Silent Waters", poster: "https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=300&h=450&fit=crop", year: "2024", rating: 7.6, genre: "Horror" },
  { id: "3", title: "The Summit", poster: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=450&fit=crop", year: "2024", rating: 8.4, genre: "Adventure" },
  { id: "4", title: "Midnight Run", poster: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&h=450&fit=crop", year: "2024", rating: 7.9, genre: "Action" },
  { id: "5", title: "Lost in Paris", poster: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&h=450&fit=crop", year: "2024", rating: 8.0, genre: "Romance" },
]

const recommendedVideos = [
  { id: "1", title: "How AI is Changing Everything in 2024", thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=340&fit=crop", duration: "28:45", views: "5.2M", channel: "Tech Insights", type: "video" as const },
  { id: "2", title: "Travel Vlog: Hidden Gems of Japan", thumbnail: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=340&fit=crop", duration: "22:10", views: "1.8M", channel: "Wanderlust", type: "video" as const },
  { id: "3", title: "Home Workout: No Equipment Needed", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=340&fit=crop", duration: "35:00", views: "4.5M", channel: "FitLife", type: "video" as const },
  { id: "4", title: "The Art of Coffee Making", thumbnail: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=340&fit=crop", duration: "16:30", views: "980K", channel: "Brew Masters", type: "video" as const },
]

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeTab, setActiveTab] = useState("home")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />
      
      <FeaturedLive />
      
      <div className="relative z-10 bg-background">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-0">
          <CategoryTabs 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        
        <LiveRow 
          title="Live Now" 
          streams={liveStreams} 
        />

        <StoriesRow stories={stories} />
        
        <ContentRow 
          title="Continue Watching" 
          items={continueWatching} 
        />
        
        <ContentRow 
          title="Trending Videos" 
          items={trendingVideos} 
        />
        
        <MovieRow 
          title="Top Movies on StreamVerse" 
          movies={topMovies} 
        />
        
        <ContentRow 
          title="Recommended Channels" 
          items={recommendedVideos} 
        />
        </div>
      </div>

      <Footer />

      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </main>
  )
}
