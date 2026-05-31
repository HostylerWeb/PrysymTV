"use client"

import { Bell, Cast, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { NotificationsModal } from "@/components/notifications-modal"

interface HeaderProps {
  onSearchClick: () => void
}

export function Header({ onSearchClick }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none">
        <div className="flex items-center justify-between px-4 py-4 pointer-events-auto md:ml-20">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <img src="/logo.webp" alt="Prysym TV" className="h-8 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              title="Cast (coming soon)"
            >
              <Cast className="w-5 h-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors relative"
            >
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
            <button
              type="button"
              onClick={onSearchClick}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  )
}
