"use client"

import { Home, Film, Play, User, Headphones, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "verticals", label: "Verticals", icon: LayoutGrid, href: "/verticals" },
  { id: "movies", label: "Movies", icon: Film, href: "/movies" },
  { id: "shorts", label: "Shorts", icon: Play, href: "/shorts" },
  { id: "podcasts", label: "Podcasts", icon: Headphones, href: "/podcasts" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
]

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl">
        <div className="flex items-center justify-around px-1 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const content = (
              <div
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("w-6 h-6", isActive && "scale-110")}
                  fill={
                    isActive && !["movies", "podcasts", "verticals"].includes(tab.id)
                      ? "currentColor"
                      : "none"
                  }
                />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </div>
            )
            return (
              <Link key={tab.id} href={tab.href}>
                <button type="button" onClick={() => onTabChange(tab.id)}>
                  {content}
                </button>
              </Link>
            )
          })}
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-20 flex-col items-center py-5 gap-1 bg-background/95 backdrop-blur-xl border-r border-border/60 shadow-xl">
        <Link href="/" className="mb-6 flex-shrink-0 mt-2">
          <img src="/favicon.webp" alt="Prysym TV" className="w-10 h-10 object-contain drop-shadow-lg" />
        </Link>
        <div className="flex flex-col items-center gap-1 w-full flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const content = (
              <div
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-xl transition-all cursor-pointer",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-primary rounded-r-full" />
                )}
                <Icon
                  className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "scale-110")}
                  fill={
                    isActive && !["movies", "podcasts", "verticals"].includes(tab.id)
                      ? "currentColor"
                      : "none"
                  }
                />
                <span className="text-[10px] font-medium text-center leading-none">{tab.label}</span>
              </div>
            )
            return (
              <Link key={tab.id} href={tab.href} className="w-full px-2">
                <button type="button" onClick={() => onTabChange(tab.id)} className="w-full">
                  {content}
                </button>
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
