"use client"

import { Film, Play, Headphones, LayoutGrid, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface BottomNavigationProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export const SIDEBAR_TABS = [
  { id: "videos", label: "Videos", icon: Video, href: "/videos" },
  { id: "movies", label: "Movies", icon: Film, href: "/movies" },
  { id: "shorts", label: "Shorts", icon: Play, href: "/shorts" },
  { id: "verticals", label: "Verticals", icon: LayoutGrid, href: "/verticals" },
  { id: "podcasts", label: "Podcasts", icon: Headphones, href: "/podcasts" },
] as const

const OUTLINE_WHEN_ACTIVE = new Set(["movies", "podcasts", "verticals", "videos"])

export function BottomNavigation({ activeTab = "none", onTabChange }: BottomNavigationProps) {
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl">
        <div className="flex items-center justify-around px-1 py-2">
          {SIDEBAR_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => onTabChange?.(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[52px]",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("w-6 h-6", isActive && "scale-110")}
                  fill={isActive && !OUTLINE_WHEN_ACTIVE.has(tab.id) ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-20 flex-col items-center py-5 gap-1 bg-background/95 backdrop-blur-xl border-r border-border/60 shadow-xl">
        <Link href="/" className="mb-6 flex-shrink-0 mt-2" title="Home">
          <img src="/favicon.webp" alt="Prysym TV" className="w-10 h-10 object-contain drop-shadow-lg" />
        </Link>
        <div className="flex flex-col items-center gap-1 w-full flex-1">
          {SIDEBAR_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                href={tab.href}
                title={tab.label}
                onClick={() => onTabChange?.(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 mx-2 rounded-xl transition-all",
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
                  fill={isActive && !OUTLINE_WHEN_ACTIVE.has(tab.id) ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium text-center leading-none">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
