"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Search } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ADMIN_NAV } from "@/lib/admin/nav"
import { useAdminBadges } from "@/lib/admin/use-admin-badges"
import { cn } from "@/lib/utils"

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminTopbar({ title }: { title?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const badges = useAdminBadges(pathname)

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <SheetHeader className="p-5 border-b border-border text-left">
            <SheetTitle>Prysym Admin</SheetTitle>
          </SheetHeader>
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
            {ADMIN_NAV.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5",
                        isActive(pathname, item.href)
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                      {badge > 0 && (
                        <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm md:text-base truncate">{title}</p>}
      </div>

      <div className="hidden sm:flex items-center gap-2 max-w-xs flex-1">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search users…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/60 border border-border text-sm"
            disabled
            title="Coming soon"
          />
        </div>
      </div>

      <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
        UI preview
      </span>
    </header>
  )
}
