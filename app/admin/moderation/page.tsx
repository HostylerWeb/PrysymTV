"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import { useAdminListDateFilter } from "@/components/admin/use-admin-list-date-filter"
import { deleteAdminReport, fetchAdminReports } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
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

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "reviewed", label: "In review" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" },
]

export default function AdminModerationPage() {
  const [tab, setTab] = useState("pending")
  const [page, setPage] = useState(1)
  const [targetType, setTargetType] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { dateRange, setDateRange, dateParams, dateDeps } = useAdminListDateFilter()

  const { data, loading, error, reload } = useAdminQuery(
    () =>
      fetchAdminReports({
        page,
        limit: 20,
        status: tab === "all" ? undefined : tab,
        ...dateParams,
      }),
    [tab, page, ...dateDeps],
  )

  const items = useMemo(() => {
    const list = data?.items ?? []
    if (targetType === "all") return list
    return list.filter((r) => r.targetType === targetType)
  }, [data?.items, targetType])

  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteAdminReport(id)
      await reload()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Content moderation"
        description="Review user-submitted reports. Dismiss, delete content, ban offenders, or remove stale reports when content is already gone."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Moderation" }]}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/moderation/history">History</Link>
          </Button>
        }
      />

      <AdminFilterBar
        tabs={TABS.map((t) => ({
          ...t,
          count: t.id === tab ? meta.total : undefined,
        }))}
        activeTab={tab}
        onTabChange={(t) => {
          setTab(t)
          setPage(1)
        }}
      />

      <AdminDateRangePicker
        className="mb-4"
        value={dateRange}
        onChange={setDateRange}
        allowClear
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={targetType} onValueChange={setTargetType}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Target type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="comment">Comment</SelectItem>
            <SelectItem value="stream">Stream</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="podcast_episode">Podcast</SelectItem>
            <SelectItem value="vertical_episode">Vertical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading reports…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => {
              const contentRemoved = r.targetTitle === "(removed)"
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {r.targetTitle}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{r.targetType}</TableCell>
                  <TableCell className="capitalize">{r.reason}</TableCell>
                  <TableCell>{r.reporter}</TableCell>
                  <TableCell>
                    <AdminStatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!contentRemoved && (
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                          <Link href={`/admin/moderation/${r.id}`}>Review</Link>
                        </Button>
                      )}
                      <AdminConfirmDialog
                        title="Remove this report?"
                        description={
                          contentRemoved
                            ? "The reported content no longer exists. This removes the report from the queue permanently."
                            : "This removes the report record only. It does not delete the reported content."
                        }
                        confirmLabel="Remove report"
                        onConfirm={() => void handleDelete(r.id)}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={deletingId === r.id}
                          >
                            {deletingId === r.id ? "Removing…" : "Delete"}
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
      />
    </>
  )
}
