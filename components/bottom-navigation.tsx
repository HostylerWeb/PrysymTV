"use client"

import { Home, Search, Film, Play, User, Headphones } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onSearchClick: () => void
}

const tabs = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "search", label: "Search", icon: Search, href: null },
  { id: "movies", label: "Movies", icon: Film, href: "/movies" },
  { id: "shorts", label: "Shorts", icon: Play, href: "/shorts" },
  { id: "podcasts", label: "Podcasts", icon: Headphones, href: "/podcasts" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
]

export function BottomNavigation({ activeTab, onTabChange, onSearchClick }: BottomNavigationProps) {
  return (
    <>
      {/* ─── MOBILE: classic bottom bar ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            const handleClick = () => {
              if (tab.id === "search") onSearchClick()
              else onTabChange(tab.id)
            }

            const content = (
              <div className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}>
                <Icon
                  className={cn("w-6 h-6 transition-transform", isActive && "scale-110")}
                  fill={isActive && !['movies', 'podcasts', 'search'].includes(tab.id) ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </div>
            )

            if (tab.href && tab.id !== "search") {
              return (
                <Link key={tab.id} href={tab.href}>
                  <button onClick={handleClick}>{content}</button>
                </Link>
              )
            }
            return <button key={tab.id} onClick={handleClick}>{content}</button>
          })}
        </div>
      </nav>

      {/* ─── DESKTOP: fixed left sidebar ─── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-20 flex-col items-center py-5 gap-1 bg-background/95 backdrop-blur-xl border-r border-border/60 shadow-xl">
        {/* Logo */}
        <Link href="/" className="mb-6 flex-shrink-0 mt-2">
          <div className="hover:scale-105 transition-transform">
            <img src="/favicon.webp" alt="Prysym TV" className="w-10 h-10 object-contain drop-shadow-lg" />
          </div>
        </Link>

        {/* Nav items */}
        <div className="flex flex-col items-center gap-1 w-full flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            const handleClick = () => {
              if (tab.id === "search") onSearchClick()
              else onTabChange(tab.id)
            }

            const content = (
              <div className={cn(
                "group relative flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-xl transition-all duration-200 cursor-pointer select-none",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}>
                {/* Active left-edge indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-primary rounded-r-full" />
                )}
                <Icon
                  className={cn("w-5 h-5 transition-transform duration-200 group-hover:scale-110", isActive && "scale-110")}
                  fill={isActive && !['movies', 'podcasts', 'search'].includes(tab.id) ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium leading-none text-center">{tab.label}</span>
              </div>
            )

            if (tab.href && tab.id !== "search") {
              return (
                <Link key={tab.id} href={tab.href} className="w-full px-2">
                  <button onClick={handleClick} className="w-full">{content}</button>
                </Link>
              )
            }
            return (
              <button key={tab.id} onClick={handleClick} className="w-full px-2">{content}</button>
            )
          })}
        </div>
      </aside>
    </>
  )
}
