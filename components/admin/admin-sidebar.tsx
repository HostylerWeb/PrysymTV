"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { ADMIN_NAV } from "@/lib/admin/nav"
import { useAdminBadges } from "@/lib/admin/use-admin-badges"
import { useAuth } from "@/contexts/auth-context"

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const badges = useAdminBadges(pathname)

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-3">
          <img src="/favicon.webp" alt="" className="w-9 h-9" />
          <div>
            <p className="font-bold text-sm leading-tight">Prysym Admin</p>
            <p className="text-[10px] text-muted-foreground">Operator console</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {ADMIN_NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href)
                const badge = item.badgeKey ? badges[item.badgeKey] : 0
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        {user && (
          <p className="text-xs text-muted-foreground truncate px-1">{user.username}</p>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
        >
          <ExternalLink className="w-4 h-4" />
          Consumer site
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </aside>
  )
}
