import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminKpiCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  href?: string
  accent?: "default" | "warning" | "live"
}) {
  const inner = (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 md:p-5 transition-colors",
        href && "hover:border-primary/40 hover:bg-card/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl md:text-3xl font-bold mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            accent === "warning" && "bg-amber-500/15 text-amber-400",
            accent === "live" && "bg-primary/15 text-primary",
            (!accent || accent === "default") && "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
