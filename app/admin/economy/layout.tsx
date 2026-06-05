"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ECONOMY_TABS = [
  { href: "/admin/economy", label: "Overview", exact: true },
  { href: "/admin/economy/transactions", label: "Transactions" },
  { href: "/admin/economy/gifts", label: "Gift activity" },
]

export default function AdminEconomyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-4 mb-2 border-b border-border">
        {ECONOMY_TABS.map((tab) => {
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
