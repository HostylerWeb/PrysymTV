"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { Button } from "@/components/ui/button"

export function CompleteProfileBanner() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [open, setOpen] = useState(false)

  if (isLoading || !isAuthenticated || !user || user.gender) {
    return null
  }

  return (
    <>
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-foreground">
          Complete your profile — tell us your gender so we can personalize your experience.
        </p>
        <Button size="sm" className="rounded-full shrink-0" onClick={() => setOpen(true)}>
          Complete profile
        </Button>
      </div>
      <EditProfileModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
