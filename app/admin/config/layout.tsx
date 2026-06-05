"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const CONFIG_TABS = [
  { href: "/admin/config/revenue", label: "Revenue" },
  { href: "/admin/config/ads", label: "Ad network" },
  { href: "/admin/config/economy", label: "Economy" },
  { href: "/admin/config/scorecard", label: "Scorecard" },
  { href: "/admin/config/programs", label: "Programs" },
  { href: "/admin/config/analytics", label: "Analytics defaults" },
]

export default function AdminConfigLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-4 mb-2 border-b border-border">
        {CONFIG_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              pathname === tab.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
