"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { DollarSign, Flag, Radio, Users, Wallet } from "lucide-react"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { AdminMiniChart } from "@/components/admin/admin-mini-chart"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  exportAdminAnalyticsCsv,
  fetchAdminAnalyticsConfig,
  fetchAdminAnalyticsContent,
  fetchAdminAnalyticsGeography,
  fetchAdminAnalyticsTimeseries,
  fetchAdminContentStats,
  fetchAdminOverview,
} from "@/lib/api/admin"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import {
  buildPresetRange,
  dateRangeQueryParams,
  DEFAULT_ADMIN_DATE_RANGE,
  formatDateRangeLabel,
  type AdminDateRangeValue,
} from "@/lib/admin/date-range"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<AdminDateRangeValue>(DEFAULT_ADMIN_DATE_RANGE)
  const [exportBusy, setExportBusy] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const dateParams = dateRangeQueryParams(dateRange)
  const rangeLabel = formatDateRangeLabel(dateRange)

  const { data: analyticsConfig } = useAdminQuery(fetchAdminAnalyticsConfig, [])
  const { data: overview, loading, error } = useAdminQuery(fetchAdminOverview, [])
  const { data: contentStats } = useAdminQuery(fetchAdminContentStats, [])
  const { data: timeseries, loading: tsLoading } = useAdminQuery(
    () => fetchAdminAnalyticsTimeseries(dateParams),
    [dateRange.dateFrom, dateRange.dateTo, dateRange.preset],
  )
  const { data: contentAnalytics } = useAdminQuery(
    () => fetchAdminAnalyticsContent(dateParams),
    [dateRange.dateFrom, dateRange.dateTo, dateRange.preset],
  )
  const { data: geography } = useAdminQuery(
    () => fetchAdminAnalyticsGeography(dateParams),
    [dateRange.dateFrom, dateRange.dateTo, dateRange.preset],
  )

  useEffect(() => {
    if (!analyticsConfig?.defaultRange) return
    const mapped =
      analyticsConfig.defaultRange === "today"
        ? "7d"
        : analyticsConfig.defaultRange
    if (mapped === "7d" || mapped === "30d" || mapped === "90d") {
      setDateRange(buildPresetRange(mapped))
    }
  }, [analyticsConfig?.defaultRange])

  const kpi = analyticsConfig?.kpiVisibility

  const handleExport = async () => {
    setExportBusy(true)
    setExportError(null)
    try {
      await exportAdminAnalyticsCsv(dateParams)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed")
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Platform analytics"
        description="Live KPIs and time-series from Postgres."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={exportBusy}
            onClick={() => void handleExport()}
          >
            {exportBusy ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      {exportError && <p className="text-sm text-destructive mb-4">{exportError}</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && !overview && (
        <p className="text-sm text-muted-foreground mb-6">Loading analytics…</p>
      )}

      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {(kpi?.dau ?? true) && (
            <AdminKpiCard label="DAU (24h)" value={overview.dau.toLocaleString()} icon={Users} />
          )}
          {(kpi?.liveNow ?? true) && (
            <AdminKpiCard
              label="Live now"
              value={overview.liveNow}
              sub={`${overview.liveViewers} viewers`}
              icon={Radio}
              href="/admin/live"
              accent="live"
            />
          )}
          {(kpi?.revenueToday ?? true) && (
            <AdminKpiCard
              label="Revenue today"
              value={`$${overview.revenueTodayUsd.toLocaleString()}`}
              icon={DollarSign}
            />
          )}
          {(kpi?.pendingReports ?? true) && (
            <AdminKpiCard
              label="Pending reports"
              value={overview.pendingReports}
              icon={Flag}
              href="/admin/moderation"
              accent="warning"
            />
          )}
          {(kpi?.pendingPayouts ?? true) && (
            <AdminKpiCard
              label="Pending payouts"
              value={overview.pendingPayouts}
              sub={`$${overview.pendingPayoutsUsd.toLocaleString()}`}
              icon={Wallet}
              href="/admin/payouts"
              accent="warning"
            />
          )}
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

      <AdminDateRangePicker
        className="mb-6"
        value={dateRange}
        onChange={(value) => {
          if (value) setDateRange(value)
        }}
      />

      {tsLoading && !timeseries && (
        <p className="text-sm text-muted-foreground mb-4">Loading charts…</p>
      )}

      {timeseries && (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <AdminMiniChart
              title="Daily active users"
              buckets={timeseries.buckets}
              values={timeseries.series.dau}
            />
            <AdminMiniChart
              title="New signups"
              buckets={timeseries.buckets}
              values={timeseries.series.signups}
            />
            <AdminMiniChart
              title="Revenue (USD)"
              buckets={timeseries.buckets}
              values={timeseries.series.revenueUsd}
              valuePrefix="$"
            />
            <AdminMiniChart
              title="Live hours"
              buckets={timeseries.buckets}
              values={timeseries.series.liveHours}
              valueSuffix="h"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-medium text-sm mb-3">Revenue by source ({rangeLabel})</p>
              {timeseries.revenueBySource.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ledger batches yet.</p>
              ) : (
                <ul className="space-y-2">
                  {timeseries.revenueBySource.map((r) => (
                    <li key={r.sourceType} className="flex justify-between text-sm">
                      <span className="capitalize">{r.sourceType.replace(/_/g, " ")}</span>
                      <span className="font-medium">${r.totalUsd.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-medium text-sm mb-1">Premium subscribers</p>
              <p className="text-3xl font-bold mb-4">{timeseries.premiumSubscribers}</p>
              <p className="text-xs text-muted-foreground">Users with active premium expiry</p>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden mt-4">
            <div className="p-4 border-b border-border">
              <p className="font-medium text-sm">Top content by views</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeseries.topContent.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="max-w-[200px] truncate">{v.title}</TableCell>
                    <TableCell>{v.creator}</TableCell>
                    <TableCell className="capitalize">{v.type}</TableCell>
                    <TableCell className="text-right">{v.views.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {geography?.countries && geography.countries.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden mt-6">
          <div className="p-4 border-b border-border">
            <p className="font-medium text-sm">Geography ({rangeLabel})</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Users</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geography.countries.map((c) => (
                <TableRow key={c.countryCode}>
                  <TableCell>{c.countryCode}</TableCell>
                  <TableCell className="text-right">{c.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{c.users.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {contentAnalytics?.topDisliked && contentAnalytics.topDisliked.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden mt-6">
          <div className="p-4 border-b border-border">
            <p className="font-medium text-sm">Most disliked content ({rangeLabel})</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Dislikes</TableHead>
                <TableHead className="text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentAnalytics.topDisliked.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="max-w-[200px] truncate">{v.title}</TableCell>
                  <TableCell>{v.creator}</TableCell>
                  <TableCell className="capitalize">{v.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-right">{v.dislikesCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{v.views.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
