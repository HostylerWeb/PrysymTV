import { cn } from "@/lib/utils"

const STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  reviewed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  actioned: "bg-red-500/15 text-red-400 border-red-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  banned: "bg-red-500/15 text-red-400 border-red-500/30",
  live: "bg-primary/15 text-primary border-primary/30",
  ended: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-muted text-muted-foreground border-border",
  requested: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft: "bg-muted text-muted-foreground border-border",
  paused: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  visible: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  hidden: "bg-muted text-muted-foreground border-border",
  none: "bg-muted text-muted-foreground border-border",
}

export function AdminStatusPill({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STYLES[key] ?? "bg-secondary text-secondary-foreground border-border",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}
