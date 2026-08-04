"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getMissingProfileFields,
  needsProfileCompletion as userNeedsProfileCompletion,
  profileCompletionMessage,
  type ProfileCompletionInput,
} from "@/lib/profile-completion"

/** Extra spacer below the main header row when the profile banner is visible. */
export const PROFILE_BANNER_SPACER_CLASS = "h-[5.25rem] sm:h-[3.25rem]"

export function useNeedsProfileCompletion(): boolean {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading || !isAuthenticated || !user) return false
  const input: ProfileCompletionInput = {
    gender: user.gender,
    birthDate: user.birthDate,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
  }
  return userNeedsProfileCompletion(input)
}

export function useProfileCompletionMessage(): string | null {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading || !isAuthenticated || !user) return null
  const missing = getMissingProfileFields({
    gender: user.gender,
    birthDate: user.birthDate,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
  })
  if (missing.length === 0) return null
  return profileCompletionMessage(missing)
}

export function CompleteProfileBannerStrip({ className }: { className?: string }) {
  const needsProfile = useNeedsProfileCompletion()
  const message = useProfileCompletionMessage()
  const [open, setOpen] = useState(false)

  if (!needsProfile || !message) return null

  return (
    <>
      <div
        className={cn(
          "bg-primary/10 border-b border-primary/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0",
          className,
        )}
      >
        <p className="text-sm text-foreground">{message}</p>
        <Button size="sm" className="rounded-full shrink-0" onClick={() => setOpen(true)}>
          Continue setup
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
