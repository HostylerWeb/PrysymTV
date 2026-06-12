"use client"

import { notFound } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

const ADMIN_UI_PREVIEW = process.env.NEXT_PUBLIC_ADMIN_UI_PREVIEW === "true"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()

  const isAdmin = isAuthenticated && user?.role === "admin"
  const canAccess = ADMIN_UI_PREVIEW || isAdmin

  if (isLoading) {
    return null
  }

  if (!canAccess) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        {ADMIN_UI_PREVIEW && user?.role !== "admin" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-400">
            Admin UI preview mode — auth gate bypassed. Sign in as admin for live API data.
          </div>
        )}
        <main className="flex-1 p-4 pt-16 md:pt-6 md:p-6 lg:p-8 w-full max-w-[1400px]">{children}</main>
      </div>
    </div>
  )
}
