"use client"

import Link from "next/link"
import { DollarSign, Flag, Radio, Users, Wallet } from "lucide-react"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminContentStats, fetchAdminOverview } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"

const CHART_PLACEHOLDERS = [
  { title: "DAU / WAU / MAU", range: "30d" },
  { title: "Revenue by source", range: "30d" },
  { title: "New signups", range: "7d" },
  { title: "Top content by views", range: "30d" },
  { title: "Live hours", range: "30d" },
  { title: "Premium subscribers", range: "30d" },
]

export default function AdminAnalyticsPage() {
  const { data: overview, loading, error } = useAdminQuery(fetchAdminOverview, [])
  const { data: contentStats } = useAdminQuery(fetchAdminContentStats, [])

  return (
    <>
      <AdminPageHeader
        title="Platform analytics"
        description="Live KPIs from the API. Time-series charts ship in a later phase."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]}
        actions={
          <Button variant="outline" size="sm" className="rounded-full" disabled>
            Export CSV
          </Button>
        }
      />

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && !overview && (
        <p className="text-sm text-muted-foreground mb-6">Loading analytics…</p>
      )}

      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <AdminKpiCard label="DAU (24h)" value={overview.dau.toLocaleString()} icon={Users} />
          <AdminKpiCard
            label="Live now"
            value={overview.liveNow}
            sub={`${overview.liveViewers} viewers`}
            icon={Radio}
            href="/admin/live"
            accent="live"
          />
          <AdminKpiCard
            label="Revenue today"
            value={`$${overview.revenueTodayUsd.toLocaleString()}`}
            icon={DollarSign}
          />
          <AdminKpiCard
            label="Pending reports"
            value={overview.pendingReports}
            icon={Flag}
            href="/admin/moderation"
            accent="warning"
          />
          <AdminKpiCard
            label="Pending payouts"
            value={overview.pendingPayouts}
            sub={`$${overview.pendingPayoutsUsd.toLocaleString()}`}
            icon={Wallet}
            href="/admin/payouts"
            accent="warning"
          />
        </div>
      )}

      {contentStats && (
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <p className="font-medium text-sm mb-3">Content library</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Total views</p>
              <p className="font-semibold">{contentStats.totalViews.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Videos</p>
              <p className="font-semibold">{contentStats.videos}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Shorts</p>
              <p className="font-semibold">{contentStats.shorts}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Comments</p>
              <p className="font-semibold">{contentStats.comments}</p>
            </div>
          </div>
          <Button asChild variant="link" size="sm" className="mt-3 px-0">
            <Link href="/admin/content">Open content library</Link>
          </Button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {["7d", "30d", "90d"].map((r) => (
          <Button
            key={r}
            variant={r === "30d" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            disabled
          >
            {r}
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CHART_PLACEHOLDERS.map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-border bg-card p-5 min-h-[200px] flex flex-col"
          >
            <p className="font-medium text-sm">{c.title}</p>
            <p className="text-xs text-muted-foreground mb-4">{c.range}</p>
            <div className="flex-1 rounded-lg bg-secondary/40 flex items-center justify-center text-xs text-muted-foreground">
              Chart placeholder — requires analytics time-series API
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
