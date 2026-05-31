"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ProfileSettingsScreen } from "@/components/profile-settings-sheet"

/** Sends bookmarked settings URLs to profile with the sheet open on the right panel. */
export function SettingsRedirect({ screen }: { screen: ProfileSettingsScreen }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/profile?settings=${screen}`)
  }, [router, screen])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Opening settings…</p>
    </main>
  )
}
