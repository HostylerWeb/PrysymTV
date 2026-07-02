"use client"

import {
  Check,
  Clock,
  Headphones,
  LayoutGrid,
  Lock,
  Radio,
  ShoppingBag,
  Sparkles,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getCreatorCapabilities,
  hasLockedCapabilities,
  type CreatorCapabilityId,
} from "@/lib/creator-capabilities"
import type { User } from "@/contexts/auth-context"

const CAP_ICONS: Record<CreatorCapabilityId, typeof Video> = {
  shorts: Video,
  videos: Video,
  podcasts: Headphones,
  verticals: LayoutGrid,
  live: Radio,
  store: ShoppingBag,
}

interface CreatorPermissionsCardProps {
  user: User | null
  onUnlock: () => void
}

export function CreatorPermissionsCard({ user, onUnlock }: CreatorPermissionsCardProps) {
  if (!user) return null

  const caps = getCreatorCapabilities(user)
  const showUnlock = hasLockedCapabilities(user)
  const readyCount = caps.filter((c) => c.allowed).length

  return (
    <div className="rounded-xl border border-border/80 bg-card/40 px-3 py-3 md:px-4 md:py-3.5">
      <div className="mb-2.5">
        <p className="text-xs font-semibold text-foreground leading-tight">Creator access</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {readyCount}/{caps.length} formats · use <span className="text-foreground/80">+</span> to create
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 md:gap-2">
        {caps.map((cap) => {
          const Icon = CAP_ICONS[cap.id]
          const state = cap.allowed ? "ready" : cap.pending ? "pending" : "locked"

          return (
            <div
              key={cap.id}
              title={cap.description}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-center border transition-colors",
                state === "ready" && "border-green-500/25 bg-green-500/5",
                state === "pending" && "border-amber-500/25 bg-amber-500/5",
                state === "locked" && "border-border/60 bg-secondary/20",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-3.5 h-3.5",
                    state === "ready" && "text-green-600 dark:text-green-400",
                    state === "pending" && "text-amber-600 dark:text-amber-400",
                    state === "locked" && "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-background",
                    state === "ready" && "bg-green-500 text-white",
                    state === "pending" && "bg-amber-500 text-white",
                    state === "locked" && "bg-muted text-muted-foreground",
                  )}
                >
                  {state === "ready" ? (
                    <Check className="w-2 h-2" strokeWidth={3} />
                  ) : state === "pending" ? (
                    <Clock className="w-2 h-2" strokeWidth={3} />
                  ) : (
                    <Lock className="w-2 h-2" strokeWidth={3} />
                  )}
                </span>
              </div>
              <span className="text-[9px] md:text-[10px] font-medium leading-tight text-foreground/90 line-clamp-2">
                {cap.label}
              </span>
            </div>
          )
        })}
      </div>

      {showUnlock && (
        <Button
          onClick={onUnlock}
          className="mt-3 w-full h-9 rounded-full text-sm font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          Unlock more features
        </Button>
      )}
    </div>
  )
}
