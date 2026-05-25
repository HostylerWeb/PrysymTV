"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Mic, TrendingUp, Clock, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const recentSearches = [
  "The Last Frontier",
  "Gaming live streams",
  "Cooking tutorials",
  "Travel vlogs Japan"
]

const trendingSearches = [
  { text: "New movie releases 2024", category: "Movies" },
  { text: "ProGamerX tournament", category: "Live" },
  { text: "AI technology explained", category: "Tech" },
  { text: "Home workout no equipment", category: "Fitness" },
  { text: "Budget travel tips", category: "Travel" },
  { text: "Best documentaries", category: "Movies" },
]

const quickCategories = [
  { label: "Movies", color: "bg-blue-500/20 text-blue-400" },
  { label: "Live", color: "bg-red-500/20 text-red-400" },
  { label: "Music", color: "bg-purple-500/20 text-purple-400" },
  { label: "Gaming", color: "bg-green-500/20 text-green-400" },
  { label: "Sports", color: "bg-orange-500/20 text-orange-400" },
  { label: "News", color: "bg-cyan-500/20 text-cyan-400" },
]

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const handleVoiceSearch = () => {
    setIsListening(true)
    // Simulate voice search animation
    setTimeout(() => setIsListening(false), 3000)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Here you would typically trigger a search
  }

  const clearSearch = () => {
    setSearchQuery("")
    inputRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="w-full h-full md:h-auto md:max-h-[85vh] md:w-[600px] bg-background md:rounded-3xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos, movies, channels..."
              className="w-full bg-secondary/50 rounded-full pl-11 pr-12 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="absolute right-12 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button 
              onClick={handleVoiceSearch}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isListening ? "bg-primary" : "hover:bg-secondary"
              )}
            >
              <Mic className={cn(
                "w-5 h-5",
                isListening ? "text-primary-foreground animate-pulse" : "text-muted-foreground"
              )} />
            </button>
          </div>
        </div>
      </div>

      {/* Search Content */}
      <div className="overflow-y-auto h-[calc(100vh-64px)]">
        {/* Voice Search Overlay */}
        {isListening && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 animate-ping absolute" />
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center relative">
                <Mic className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <p className="text-lg font-medium text-foreground mb-2">Listening...</p>
            <p className="text-sm text-muted-foreground">Say what you want to search</p>
          </div>
        )}

        {!isListening && (
          <div className="px-4 py-4">
            {/* Quick Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Quick Categories</h3>
              <div className="flex flex-wrap gap-2">
                {quickCategories.map((category) => (
                  <button
                    key={category.label}
                    onClick={() => handleSearch(category.label)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-transform active:scale-95",
                      category.color
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Recent Searches</h3>
                  <button className="text-xs text-primary font-medium">Clear All</button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 transition-colors"
                    >
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1 text-left text-sm text-foreground">{search}</span>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Trending Now
              </h3>
              <div className="space-y-1">
                {trendingSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item.text)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 text-left">
                      <p className="text-sm text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results Placeholder */}
            {searchQuery && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-muted-foreground py-12">
                  Search results for &quot;{searchQuery}&quot; would appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
