"use client"

import Link from "next/link"
import { MessageSquare, Mic, Radio, User, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

type ReportPreviewProps = {
  targetType: string
  targetTitle: string
  targetId: string
  reason?: string
  excerpt?: string
}

const TYPE_META: Record<string, { icon: typeof Video; label: string }> = {
  video: { icon: Video, label: "Video" },
  short: { icon: Video, label: "Short" },
  comment: { icon: MessageSquare, label: "Comment" },
  stream: { icon: Radio, label: "Live stream" },
  user: { icon: User, label: "User profile" },
  podcast_episode: { icon: Mic, label: "Podcast episode" },
  vertical_episode: { icon: Video, label: "Vertical episode" },
}

export function AdminReportPreview({
  targetType,
  targetTitle,
  targetId,
  reason,
  excerpt,
}: ReportPreviewProps) {
  const meta = TYPE_META[targetType] ?? { icon: Video, label: targetType }
  const Icon = meta.icon

  if (targetType === "comment") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {meta.label} preview
        </p>
        <blockquote className="border-l-4 border-primary/40 pl-4 py-2 text-sm italic bg-secondary/30 rounded-r-lg">
          {excerpt ?? "Check out my channel for free coins!!!"}
        </blockquote>
        <p className="text-xs text-muted-foreground">
          On: {targetTitle} · ID {targetId}
        </p>
        {reason && (
          <p className="text-xs">
            Reason: <span className="capitalize font-medium">{reason}</span>
          </p>
        )}
        <Button asChild variant="link" className="px-0 h-auto" size="sm">
          <Link href="/">View parent content →</Link>
        </Button>
      </div>
    )
  }

  if (targetType === "user") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {meta.label}
        </p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{targetTitle}</p>
            <p className="text-sm text-muted-foreground">ID {targetId}</p>
          </div>
        </div>
        <Button asChild variant="link" className="px-0 h-auto" size="sm">
          <Link href={`/admin/users/${targetId}`}>Open user profile →</Link>
        </Button>
      </div>
    )
  }

  if (targetType === "stream") {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          {meta.label}
        </p>
        <div className="aspect-video rounded-lg bg-muted relative overflow-hidden flex items-center justify-center">
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
            LIVE
          </span>
          <p className="text-sm text-muted-foreground px-4 text-center">{targetTitle}</p>
        </div>
        <Button asChild variant="link" className="px-0 h-auto" size="sm">
          <Link href="/admin/live">Open live console →</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {meta.label} preview
      </p>
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center relative">
        <Video className="w-12 h-12 text-muted-foreground/40" />
        <p className="absolute bottom-3 left-3 right-3 text-sm font-medium truncate">{targetTitle}</p>
      </div>
      <p className="text-xs text-muted-foreground font-mono">{targetId}</p>
      <Button asChild variant="link" className="px-0 h-auto" size="sm">
        <Link href="/">View on site →</Link>
      </Button>
    </div>
  )
}
