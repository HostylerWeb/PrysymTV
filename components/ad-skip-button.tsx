"use client"

import { cn } from "@/lib/utils"

const skipButtonClass =
  "text-sm font-bold text-white bg-black/75 border border-white/25 shadow-[0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-sm px-4 py-1.5 rounded-full hover:bg-black/85 transition-colors"

const countdownClass =
  "text-sm font-medium text-white bg-black/65 border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.45)] backdrop-blur-sm px-3 py-1 rounded-full"

type AdSkipButtonProps = {
  onClick: () => void
  className?: string
  children?: React.ReactNode
}

export function AdSkipButton({
  onClick,
  className,
  children = "Skip Ad",
}: AdSkipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(skipButtonClass, className)}
    >
      {children}
    </button>
  )
}

export function AdSkipCountdown({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={cn(countdownClass, className)}>{children}</span>
}
