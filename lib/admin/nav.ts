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
  Building2,
  Landmark,
  ScrollText,
} from "lucide-react"

export type AdminNavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: "reports" | "applications" | "payouts" | "live"
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
      {
        id: "applications",
        label: "Applications",
        href: "/admin/applications",
        icon: UserCheck,
        badgeKey: "applications",
      },
    ],
  },
  {
    title: "Money",
    items: [
      { id: "payouts", label: "Payouts", href: "/admin/payouts", icon: Wallet, badgeKey: "payouts" },
      { id: "revenue", label: "Revenue", href: "/admin/revenue", icon: Percent },
      { id: "ads", label: "Ads", href: "/admin/ads", icon: Megaphone },
      { id: "advertisers", label: "Advertisers", href: "/admin/advertisers", icon: Building2 },
      { id: "gaf", label: "GAF", href: "/admin/gaf", icon: Landmark },
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
    items: [
      { id: "audit-log", label: "Audit log", href: "/admin/audit-log", icon: ScrollText },
      { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
]

