"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDeleteButton } from "@/components/admin/admin-confirm-dialog"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import { dateRangeQueryParams, type AdminDateRangeValue } from "@/lib/admin/date-range"
import { deleteAdminAdCampaign, duplicateAdminAdCampaign, fetchAdminAdCampaigns } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminAdsPage() {
  const [status, setStatus] = useState("")
  const [placement, setPlacement] = useState("")
  const [search, setSearch] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<AdminDateRangeValue | null>(null)

  const { data: campaigns, loading, error, reload } = useAdminQuery(
    () =>
      fetchAdminAdCampaigns({
        status: status || undefined,
        placement: placement || undefined,
        q: search || undefined,
        ...dateRangeQueryParams(dateRange),
      }),
    [status, placement, search, dateRange?.dateFrom, dateRange?.dateTo],
  )

  const filtered = useMemo(() => {
    const list = campaigns ?? []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.advertiserName.toLowerCase().includes(q),
    )
  }, [campaigns, search])

  const duplicate = async (id: string) => {
    setBusyId(id)
    try {
      await duplicateAdminAdCampaign(id)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    setBusyId(id)
    try {
      await deleteAdminAdCampaign(id)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Ad campaigns"
        description="Private ad network — create and monitor campaigns."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Ads" }]}
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/ads/new">New campaign</Link>
          </Button>
        }
      />

      <AdminDateRangePicker
        className="mb-4"
        value={dateRange}
        onChange={setDateRange}
        allowClear
        label="Campaign dates"
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search campaigns…"
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={placement || "all"} onValueChange={(v) => setPlacement(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Placement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All placements</SelectItem>
            <SelectItem value="home_banner">Home banner</SelectItem>
            <SelectItem value="shorts_interstitial">Shorts interstitial</SelectItem>
            <SelectItem value="movie_preroll">Movie preroll</SelectItem>
            <SelectItem value="vertical_episode">Vertical episode</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading campaigns…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const delivered = c.deliveredImpressions
              const target = c.targetImpressions || 1
              const pct = Math.round((delivered / target) * 100)
              const ctr = delivered > 0 ? ((c.clicks / delivered) * 100).toFixed(2) : "0.00"
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.advertiserName}</p>
                  </TableCell>
                  <TableCell className="text-sm capitalize">{c.placement.replace(/_/g, " ")}</TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{ctr}%</TableCell>
                  <TableCell>
                    <AdminStatusPill status={c.status} />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={`/admin/ads/${c.id}`}>View</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      disabled={busyId === c.id}
                      onClick={() => void duplicate(c.id)}
                    >
                      Duplicate
                    </Button>
                    <AdminDeleteButton
                      itemLabel="campaign"
                      onConfirm={() => remove(c.id)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
