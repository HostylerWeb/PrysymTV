"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Extra spacer below the main header row when the profile banner is visible. */
export const PROFILE_BANNER_SPACER_CLASS = "h-[5.25rem] sm:h-[3.25rem]"

export function useNeedsProfileCompletion(): boolean {
  const { user, isAuthenticated, isLoading } = useAuth()
  return !isLoading && isAuthenticated && !!user && !user.gender
}

export function CompleteProfileBannerStrip({ className }: { className?: string }) {
  const needsProfile = useNeedsProfileCompletion()
  const [open, setOpen] = useState(false)

  if (!needsProfile) return null

  return (
    <>
      <div
        className={cn(
          "bg-primary/10 border-b border-primary/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0",
          className,
        )}
      >
        <p className="text-sm text-foreground">
          Complete your profile so we can personalize your experience.
        </p>
        <Button size="sm" className="rounded-full shrink-0" onClick={() => setOpen(true)}>
          Complete profile
        </Button>
      </div>
      <EditProfileModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}

/** @deprecated Use CompleteProfileBannerStrip inside Header instead. */
export function CompleteProfileBanner() {
  return <CompleteProfileBannerStrip />
}

export function appHeaderOffsetClass(needsProfileBanner: boolean): string {
  if (needsProfileBanner) {
    return `h-[calc(4.5rem+5.25rem)] sm:h-[calc(4.5rem+3.25rem)]`
  }
  return "h-[4.5rem]"
}
