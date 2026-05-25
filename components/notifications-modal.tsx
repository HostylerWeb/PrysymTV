"use client"

import { useState } from "react"
import { X, Settings, Check, Bell, Heart, MessageCircle, UserPlus, Play, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

type NotificationType = "like" | "comment" | "follow" | "upload" | "live" | "system"

interface Notification {
  id: string
  type: NotificationType
  avatar: string
  user: string
  message: string
  time: string
  isRead: boolean
  thumbnail?: string
  actionUrl?: string
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "live",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    user: "Prysym TV Originals",
    message: "just went live: The Last Frontier - Behind the Scenes",
    time: "Just now",
    isRead: false,
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&h=70&fit=crop",
    actionUrl: "/watch"
  },
  {
    id: "2",
    type: "like",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    user: "Sarah Miller",
    message: "liked your comment",
    time: "5 min ago",
    isRead: false,
    actionUrl: "/watch"
  },
  {
    id: "3",
    type: "comment",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    user: "Mike Johnson",
    message: "replied to your comment: \"Absolutely agree with this!\"",
    time: "15 min ago",
    isRead: false,
    actionUrl: "/watch"
  },
  {
    id: "4",
    type: "follow",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    user: "Emma Watson",
    message: "started following you",
    time: "1 hour ago",
    isRead: true,
    actionUrl: "/creator/emma-watson"
  },
  {
    id: "5",
    type: "upload",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    user: "Tech Insights",
    message: "uploaded a new video: How AI is Changing Everything",
    time: "2 hours ago",
    isRead: true,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=120&h=70&fit=crop",
    actionUrl: "/watch"
  },
  {
    id: "6",
    type: "system",
    avatar: "",
    user: "Prysym TV",
    message: "Your video \"Summer Adventures\" reached 10K views!",
    time: "5 hours ago",
    isRead: true,
    actionUrl: "/profile"
  },
  {
    id: "7",
    type: "like",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
    user: "Tech Enthusiast",
    message: "and 12 others liked your video",
    time: "8 hours ago",
    isRead: true,
    actionUrl: "/watch"
  },
  {
    id: "8",
    type: "comment",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
    user: "Creative Mind",
    message: "commented on your video: \"This is amazing work!\"",
    time: "1 day ago",
    isRead: true,
    actionUrl: "/watch"
  },
]

const getNotificationIcon = (type: NotificationType) => {
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
    case "system":
      return <Bell className="w-4 h-4 text-yellow-500" />
    default:
      return <Bell className="w-4 h-4" />
  }
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all")
  const [notificationList, setNotificationList] = useState(notifications)

  const filteredNotifications = activeFilter === "unread" 
    ? notificationList.filter(n => !n.isRead)
    : notificationList

  const unreadCount = notificationList.filter(n => !n.isRead).length

  const markAllAsRead = () => {
    setNotificationList(notificationList.map(n => ({ ...n, isRead: true })))
  }

  const clearAll = () => {
    setNotificationList([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-end md:items-center justify-center">
      <div className="w-full h-full md:h-[80vh] md:max-h-[800px] md:w-[500px] bg-background md:rounded-3xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-300 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
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
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeFilter === "all" 
                ? "bg-foreground text-background" 
                : "bg-secondary text-foreground"
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("unread")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeFilter === "unread" 
                ? "bg-foreground text-background" 
                : "bg-secondary text-foreground"
            )}
          >
            Unread
          </button>
          <div className="flex-1" />
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-sm text-primary font-medium"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto h-[calc(100vh-140px)]">
        {filteredNotifications.length === 0 ? (
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
            {/* Today Section */}
            <div className="px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today</p>
            </div>
            {filteredNotifications.slice(0, 4).map((notification) => (
              <Link key={notification.id} href={notification.actionUrl || "#"} onClick={onClose}>
                <div 
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors",
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                  {/* Avatar with Icon Overlay */}
                  <div className="relative flex-shrink-0">
                    {notification.type === "system" ? (
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">S</span>
                      </div>
                    ) : (
                      <img
                        src={notification.avatar}
                        alt={notification.user}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center border-2 border-background">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{notification.user}</span>{" "}
                      <span className="text-foreground/80">{notification.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>

                  {/* Thumbnail (if exists) */}
                  {notification.thumbnail && (
                    <div className="relative w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={notification.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {notification.type === "live" && (
                        <span className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded">
                          LIVE
                        </span>
                      )}
                    </div>
                  )}

                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </div>
              </Link>
            ))}

            {/* Earlier Section */}
            {filteredNotifications.length > 4 && (
              <>
                <div className="px-4 py-2 mt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Earlier</p>
                </div>
                {filteredNotifications.slice(4).map((notification) => (
                  <Link key={notification.id} href={notification.actionUrl || "#"} onClick={onClose}>
                    <div 
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors",
                        !notification.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        {notification.type === "system" ? (
                          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-lg">S</span>
                          </div>
                        ) : (
                          <img
                            src={notification.avatar}
                            alt={notification.user}
                            className="w-12 h-12 rounded-full object-cover"
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
                      {notification.thumbnail && (
                        <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={notification.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* Clear All Button */}
            {notificationList.length > 0 && (
              <div className="px-4 py-6">
                <button
                  onClick={clearAll}
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
