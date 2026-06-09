"use client"

import {
  X,
  Video,
  Headphones,
  LayoutGrid,
  Radio,
  Lock,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import type { CreatorUploadKind } from "@/components/creator-upload-sheet"

export type CreateMenuAction =
  | { type: "upload"; kind: CreatorUploadKind }
  | { type: "vertical-wizard" }
  | { type: "go-live" }
  | { type: "unlock"; feature: "vertical" | "live" }
  | { type: "auth" }

interface CreateMenuSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-highlight context e.g. when opened from Shorts page */
  highlight?: CreatorUploadKind
  onAction: (action: CreateMenuAction) => void
}

const ITEMS: Array<{
  id: CreatorUploadKind | "live"
  label: string
  description: string
  icon: typeof Video
  uploadKind?: CreatorUploadKind
  requires?: "vertical" | "live"
}> = [
  {
    id: "short",
    label: "Short",
    description: "Quick vertical clip",
    icon: Video,
    uploadKind: "short",
  },
  {
    id: "video",
    label: "Long video",
    description: "Standard upload",
    icon: Video,
    uploadKind: "video",
  },
  {
    id: "podcast",
    label: "Podcast episode",
    description: "Audio for your show",
    icon: Headphones,
    uploadKind: "podcast",
  },
  {
    id: "vertical",
    label: "Micro-drama series",
    description: "Create series, cover art & episodes",
    icon: LayoutGrid,
    requires: "vertical",
  },
  {
    id: "live",
    label: "Go live",
    description: "Stream with OBS",
    icon: Radio,
    requires: "live",
  },
]

export function CreateMenuSheet({
  isOpen,
  onClose,
  highlight,
  onAction,
}: CreateMenuSheetProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isOpen) return null

  const canVertical = user?.isVerticalCreator
  const canLive = user?.streamerStatus === "approved"

  const handleItem = (item: (typeof ITEMS)[number]) => {
    if (!isAuthenticated) {
      onAction({ type: "auth" })
      return
    }
    if (item.id === "vertical") {
      if (!canVertical) {
        onAction({ type: "unlock", feature: "vertical" })
        return
      }
      onAction({ type: "vertical-wizard" })
      return
    }
    if (item.requires === "live") {
      if (!canLive) {
        onAction({ type: "unlock", feature: "live" })
        return
      }
      onAction({ type: "go-live" })
      return
    }
    if (item.uploadKind) {
      onAction({ type: "upload", kind: item.uploadKind })
    }
  }

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/70 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-background rounded-t-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Create</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 pb-8 max-h-[70vh] overflow-y-auto space-y-1">
          {ITEMS.map((item) => {
            const Icon = item.icon
            const locked =
              (item.requires === "vertical" && !canVertical) ||
              (item.requires === "live" && !canLive)
            const isHighlight = highlight && item.uploadKind === highlight

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  handleItem(item)
                  if (!locked || !isAuthenticated) onClose()
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-colors",
                  isHighlight
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary/80",
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
                    locked ? "bg-muted" : "bg-primary/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      locked ? "text-muted-foreground" : "text-primary",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-2">
                    {item.label}
                    {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
