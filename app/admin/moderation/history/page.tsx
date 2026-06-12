"use client"

import Link from "next/link"
import { useState } from "react"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import { useAdminListDateFilter } from "@/components/admin/use-admin-list-date-filter"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { deleteAdminReport, fetchAdminReports } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TABS = [
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
  { id: "reviewed", label: "Reviewed" },
]

export default function AdminModerationHistoryPage() {
  const [tab, setTab] = useState("actioned")
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { dateRange, setDateRange, dateParams, dateDeps } = useAdminListDateFilter()

  const { data, loading, error, reload } = useAdminQuery(
    () =>
      fetchAdminReports({
        page,
        limit: 20,
        status: tab,
        ...dateParams,
      }),
    [tab, page, ...dateDeps],
  )

  const items = data?.items ?? []
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
        title="Moderation history"
        description="Resolved and dismissed reports."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Moderation", href: "/admin/moderation" },
          { label: "History" },
        ]}
      />

      <AdminFilterBar
        tabs={TABS}
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

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading history…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                  No {tab} reports yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.targetTitle}</TableCell>
                  <TableCell>
                    <AdminStatusPill status={r.status} />
                  </TableCell>
                  <TableCell>{r.reporter}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.targetTitle !== "(removed)" && (
                        <Button asChild size="sm" variant="outline" className="rounded-full">
                          <Link href={`/admin/moderation/${r.id}`}>Open</Link>
                        </Button>
                      )}
                      <AdminConfirmDialog
                        title="Remove this report?"
                        description="Permanently removes this report from history."
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
              ))
            )}
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
