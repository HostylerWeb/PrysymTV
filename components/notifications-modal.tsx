"use client"

import { useCallback, useEffect, useState } from "react"
import { X, Check, Bell, Heart, MessageCircle, UserPlus, Play, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import {
  clearAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications"
import {
  mapNotificationToListItem,
  type NotificationListItem,
} from "@/lib/map-notifications"
import { ApiError } from "@/lib/api-client"

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
      return <Heart className="w-4 h-4 text-primary fill-primary" />
    case "comment":
      return <MessageCircle className="w-4 h-4 text-blue-500" />
    case "follow":
      return <UserPlus className="w-4 h-4 text-green-500" />
    case "upload":
    case "live":
      return <Play className="w-4 h-4 text-primary fill-primary" />
    case "gift":
      return <Heart className="w-4 h-4 text-amber-500 fill-amber-500" />
    case "system":
      return <Bell className="w-4 h-4 text-yellow-500" />
    default:
      return <Bell className="w-4 h-4" />
  }
}

function NotificationRow({
  notification,
  onRead,
  onClose,
}: {
  notification: NotificationListItem
  onRead: (id: string) => void
  onClose: () => void
}) {
  const content = (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors",
        !notification.isRead && "bg-primary/5",
      )}
      onClick={() => {
        if (!notification.isRead) onRead(notification.id)
      }}
    >
      <div className="relative flex-shrink-0">
        {notification.type === "system" ? (
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
        ) : (
          <img
            src={notification.avatar}
            alt=""
            className="w-12 h-12 rounded-full object-cover bg-secondary"
          />
        )}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border-2 border-background">
          {getNotificationIcon(notification.type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{notification.user}</span>{" "}
          <span className="text-foreground/80">{notification.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  )

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} onClick={onClose}>
        {content}
      </Link>
    )
  }
  return content
}

export function NotificationsModal({
  isOpen,
  onClose,
  onUnreadChange,
}: NotificationsModalProps) {
  const { isAuthenticated } = useAuth()
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all")
  const [notificationList, setNotificationList] = useState<NotificationListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchNotifications(1, 50)
      const mapped = res.items.map(mapNotificationToListItem)
      setNotificationList(mapped)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load notifications")
      setNotificationList([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isOpen && isAuthenticated) void load()
  }, [isOpen, isAuthenticated, load])

  useEffect(() => {
    if (!isOpen) return
    onUnreadChange?.(notificationList.filter((n) => !n.isRead).length)
  }, [notificationList, onUnreadChange, isOpen])

  const filteredNotifications =
    activeFilter === "unread"
      ? notificationList.filter((n) => !n.isRead)
      : notificationList

  const unreadCount = notificationList.filter((n) => !n.isRead).length

  const markOneRead = async (id: string) => {
    setNotificationList((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )
    try {
      await markNotificationRead(id)
    } catch {
      /* optimistic */
    }
  }

  const markAllAsRead = async () => {
    setNotificationList((list) => list.map((n) => ({ ...n, isRead: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      /* optimistic */
    }
  }

  const clearAll = async () => {
    try {
      await clearAllNotifications()
      setNotificationList([])
    } catch {
      /* keep list */
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="w-full h-full md:h-[80vh] md:max-h-[800px] md:w-[500px] bg-background md:rounded-3xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 shadow-2xl overflow-hidden">
        <div className="sticky top-0 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 pb-3">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeFilter === "all"
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground",
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("unread")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                activeFilter === "unread"
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground",
              )}
            >
              Unread
            </button>
            <div className="flex-1" />
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="flex items-center gap-1 text-sm text-primary font-medium"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <Bell className="w-10 h-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Sign in to see your notifications.
              </p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-destructive py-12 px-4">{error}</p>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
              <p className="text-sm text-muted-foreground text-center">
                {activeFilter === "unread"
                  ? "You're all caught up! No unread notifications."
                  : "When you get notifications, they'll show up here."}
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onRead={(id) => void markOneRead(id)}
                  onClose={onClose}
                />
              ))}
              {notificationList.length > 0 && (
                <div className="px-4 py-6">
                  <button
                    type="button"
                    onClick={() => void clearAll()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all notifications
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
