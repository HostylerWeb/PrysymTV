import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Flag,
  Users,
  Radio,
  Wallet,
  Megaphone,
  Percent,
  BarChart3,
  Settings,
  SlidersHorizontal,
  UserCheck,
  Film,
  Coins,
} from "lucide-react"

export type AdminNavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: "reports" | "streamers" | "payouts" | "live"
}

export type AdminNavGroup = {
  title: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Operations",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { id: "moderation", label: "Moderation", href: "/admin/moderation", icon: Flag, badgeKey: "reports" },
      { id: "live", label: "Live", href: "/admin/live", icon: Radio, badgeKey: "live" },
    ],
  },
  {
    title: "Content",
    items: [
      { id: "content", label: "Library", href: "/admin/content", icon: Film },
    ],
  },
  {
    title: "People",
    items: [
      { id: "users", label: "Users", href: "/admin/users", icon: Users },
      { id: "streamers", label: "Streamers", href: "/admin/streamers", icon: UserCheck, badgeKey: "streamers" },
    ],
  },
  {
    title: "Money",
    items: [
      { id: "payouts", label: "Payouts", href: "/admin/payouts", icon: Wallet, badgeKey: "payouts" },
      { id: "revenue", label: "Revenue", href: "/admin/revenue", icon: Percent },
      { id: "ads", label: "Ads", href: "/admin/ads", icon: Megaphone },
      { id: "economy", label: "Economy", href: "/admin/economy", icon: Coins },
    ],
  },
  {
    title: "Platform",
    items: [
      { id: "config", label: "Configuration", href: "/admin/config", icon: SlidersHorizontal },
      { id: "analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [{ id: "settings", label: "Settings", href: "/admin/settings", icon: Settings }],
  },
]

export const ADMIN_BADGE_COUNTS = {
  reports: 12,
  streamers: 4,
  payouts: 3,
  live: 2,
} as const
