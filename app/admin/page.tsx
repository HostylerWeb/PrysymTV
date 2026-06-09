"use client"

import Link from "next/link"
import { Activity, DollarSign, Film, Flag, Radio, Users, Wallet } from "lucide-react"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminAnalyticsConfig,
  fetchAdminLiveStreams,
  fetchAdminOverview,
  fetchAdminReports,
} from "@/lib/api/admin"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
  const { data: overview, loading, error } = useAdminQuery(fetchAdminOverview, [])
  const { data: liveData } = useAdminQuery(fetchAdminLiveStreams, [])
  const { data: reportsData } = useAdminQuery(
    () => fetchAdminReports({ limit: 5, status: "pending" }),
    [],
  )
  const { data: analyticsConfig } = useAdminQuery(fetchAdminAnalyticsConfig, [])

  if (loading && !overview) {
    return (
      <main className="flex items-center justify-center py-20">
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      </main>
    )
  }

  if (error && !overview) {
    return (
      <main className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-destructive text-sm">{error}</p>
        <p className="text-xs text-muted-foreground">Sign in with an admin account to load live data.</p>
      </main>
    )
  }

  const o = overview!
  const liveStreams = liveData?.items ?? []
  const recentReports = reportsData?.items ?? []
  const kpi = analyticsConfig?.kpiVisibility ?? {
    dau: true,
    liveNow: true,
    revenueToday: true,
    pendingReports: true,
    pendingPayouts: true,
  }
  const reportAlert =
    analyticsConfig?.alertPendingReportsThreshold ?? 50

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Platform health at a glance. KPIs refresh on load."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        {kpi.dau && (
          <AdminKpiCard label="DAU (24h)" value={o.dau.toLocaleString()} icon={Users} />
        )}
        {kpi.liveNow && (
          <AdminKpiCard
            label="Live now"
            value={o.liveNow}
            sub={`${o.liveViewers} viewers`}
            icon={Radio}
            href="/admin/live"
            accent="live"
          />
        )}
        {kpi.revenueToday && (
          <AdminKpiCard
            label="Revenue today"
            value={`$${o.revenueTodayUsd.toLocaleString()}`}
            icon={DollarSign}
          />
        )}
        {kpi.pendingReports && (
          <AdminKpiCard
            label="Pending reports"
            value={o.pendingReports}
            icon={Flag}
            href="/admin/moderation"
            accent={o.pendingReports > reportAlert ? "warning" : undefined}
          />
        )}
        {kpi.pendingPayouts && (
          <AdminKpiCard
            label="Pending payouts"
            value={o.pendingPayouts}
            sub={`$${o.pendingPayoutsUsd.toLocaleString()}`}
            icon={Wallet}
            href="/admin/payouts"
            accent="warning"
          />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              Live streams
            </h2>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/admin/live">View all</Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {liveStreams.length === 0 ? (
              <li className="text-sm text-muted-foreground py-4 text-center">No live streams</li>
            ) : (
              liveStreams.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.creator} · {s.viewers} watching
                    </p>
                  </div>
                  <AdminStatusPill status="live" />
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" />
              Recent reports
            </h2>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/admin/moderation">Review queue</Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {recentReports.length === 0 ? (
              <li className="text-sm text-muted-foreground py-4 text-center">Queue is clear</li>
            ) : (
              recentReports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary/30"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.targetTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.reason} · {r.reporter}
                    </p>
                  </div>
                  <AdminStatusPill status={r.status} />
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            Content library
          </h2>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/admin/content">Open library</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse videos, shorts, verticals, podcasts, and comments from the content hub.
        </p>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 md:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Pending applications</h2>
          <span className="text-sm text-muted-foreground">
            {o.pendingApplications ??
              o.pendingStreamerApplications + o.pendingVerticalCreatorApplications}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Live streaming ({o.pendingStreamerApplications}) · Vertical series (
          {o.pendingVerticalCreatorApplications})
        </p>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/admin/applications">Review applications</Link>
        </Button>
      </section>
    </>
  )
}
