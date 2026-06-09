"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CreateHeaderButtonProps {
  onClick: () => void
  /** Shorts overlay uses light icons on dark video */
  variant?: "default" | "on-dark"
  className?: string
  /** Context-specific label for screen readers */
  label?: string
}

export function CreateHeaderButton({
  onClick,
  variant = "default",
  className,
  label = "Create",
}: CreateHeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0",
        variant === "on-dark"
          ? "bg-white text-black hover:bg-white/90 shadow-lg"
          : "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20",
        className,
      )}
    >
      <Plus className="w-5 h-5" strokeWidth={2.5} />
    </button>
  )
}
