"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Header } from "@/components/header"
import { BottomNavigation } from "@/components/bottom-navigation"
import { CreatorDashboardPanel } from "@/components/creator-dashboard-panel"
import { useAuth } from "@/contexts/auth-context"

function canAccessCreatorDashboard(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return false
  if (user.role === "admin" || user.role === "creator") return true
  return (user.videosCount ?? 0) > 0
}

export default function CreatorDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/profile")
      return
    }
    if (!canAccessCreatorDashboard(user)) {
      router.replace("/profile")
    }
  }, [isAuthenticated, isLoading, router, user])

  if (isLoading || !isAuthenticated || !canAccessCreatorDashboard(user)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center md:pl-20">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8 md:pl-20">
      <Header onSearchClick={() => router.push("/search")} />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to profile
        </Link>
        <h1 className="text-2xl font-bold mb-2">Creator dashboard</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Performance, ad revenue on your content, earnings, and community impact.
        </p>
        <CreatorDashboardPanel />
      </div>
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
    </main>
  )
}
