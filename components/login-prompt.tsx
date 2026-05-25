"use client"

import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoginPromptProps {
  message?: string
  onLoginClick: () => void
}

export function LoginPrompt({ message = "Please sign in to continue", onLoginClick }: LoginPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button onClick={onLoginClick} className="rounded-full">
        Sign In
      </Button>
    </div>
  )
}
