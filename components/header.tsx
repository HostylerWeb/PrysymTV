"use client"

import { Bell, Search, User } from "lucide-react"
import { CreateHeaderButton } from "@/components/create-header-button"
import Link from "next/link"
import { userAvatarUrl } from "@/lib/user-avatar"
import { useCallback, useEffect, useState } from "react"
import { NotificationsModal } from "@/components/notifications-modal"
import { useAuth } from "@/contexts/auth-context"
import { fetchNotifications } from "@/lib/api/notifications"

interface HeaderProps {
  onSearchClick: () => void
  /** Page-specific create action (upload short, episode, etc.) */
  onCreateClick?: () => void
  /** Accessible label for the + button */
  createLabel?: string
  /** Set false only when the page hero already accounts for header height (rare). */
  offsetContent?: boolean
}

/** Matches fixed header row height (py-4 + 40px controls). */
export const APP_HEADER_HEIGHT_CLASS = "h-[4.5rem]"

export function Header({
  onSearchClick,
  onCreateClick,
  createLabel = "Create",
  offsetContent = true,
}: HeaderProps) {
  const { isAuthenticated, user } = useAuth()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnread = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }
    try {
      const res = await fetchNotifications(1, 50)
      setUnreadCount(res.items.filter((n) => !n.isRead).length)
    } catch {
      setUnreadCount(0)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void refreshUnread()
  }, [refreshUnread, isAuthenticated])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background via-background/95 to-transparent pointer-events-none md:left-20">
        <div className="flex items-center justify-between px-4 py-4 pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <img src="/logo.webp" alt="Prysym TV" className="h-8 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-2 ml-auto">
            {onCreateClick && (
              <CreateHeaderButton onClick={onCreateClick} label={createLabel} />
            )}
            <Link
              href="/profile"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors overflow-hidden border border-border/60"
              aria-label="Profile"
              title="Profile"
            >
              {isAuthenticated && user ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-foreground" />
              )}
            </Link>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              )}
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

      {offsetContent && (
        <div className={APP_HEADER_HEIGHT_CLASS} aria-hidden="true" />
      )}

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUnreadChange={setUnreadCount}
      />
    </>
  )
}
