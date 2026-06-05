"use client"

import { useState } from "react"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminPayouts } from "@/lib/api/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TABS = [
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
]

export default function AdminPayoutsHistoryPage() {
  const [tab, setTab] = useState("completed")
  const [page, setPage] = useState(1)

  const { data, loading, error } = useAdminQuery(
    () => fetchAdminPayouts({ page, limit: 20, status: tab }),
    [tab, page],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Payout history"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Payouts", href: "/admin/payouts" },
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

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading payouts…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                  No {tab} payouts yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.creator}</TableCell>
                  <TableCell>${p.amountUsd.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{p.method.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <AdminStatusPill status={p.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(p.createdAt).toLocaleDateString()}
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
