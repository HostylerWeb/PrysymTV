"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { Button } from "@/components/ui/button"

const ADMIN_UI_PREVIEW = process.env.NEXT_PUBLIC_ADMIN_UI_PREVIEW === "true"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()

  const canAccess =
    ADMIN_UI_PREVIEW || (isAuthenticated && user?.role === "admin")

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading admin…</p>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <p className="text-sm text-muted-foreground">
            Your account needs the <code className="text-xs bg-secondary px-1 rounded">admin</code> role,
            or set{" "}
            <code className="text-xs bg-secondary px-1 rounded">NEXT_PUBLIC_ADMIN_UI_PREVIEW=true</code> in{" "}
            <code className="text-xs bg-secondary px-1 rounded">.env.local</code> to preview the UI.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/">Back to Prysym TV</Link>
            </Button>
            {!isAuthenticated && (
              <Button asChild className="rounded-full">
                <Link href="/profile">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <AdminTopbar />
        {ADMIN_UI_PREVIEW && user?.role !== "admin" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-400">
            Admin UI preview mode — auth gate bypassed. Sign in as admin for live API data.
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-[1400px]">{children}</main>
      </div>
    </div>
  )
}
