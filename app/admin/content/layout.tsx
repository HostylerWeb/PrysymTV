"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const CONTENT_TABS = [
  { href: "/admin/content", label: "Overview", exact: true },
  { href: "/admin/content/videos", label: "Videos" },
  { href: "/admin/content/shorts", label: "Shorts" },
  { href: "/admin/content/movies", label: "Movies" },
  { href: "/admin/content/verticals", label: "Verticals" },
  { href: "/admin/content/podcasts", label: "Podcasts" },
  { href: "/admin/content/comments", label: "Comments" },
]

export default function AdminContentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-4 mb-2 border-b border-border">
        {CONTENT_TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}
