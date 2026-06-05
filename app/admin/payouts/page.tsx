"use client"

import { useState } from "react"
import Link from "next/link"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminPayouts, processAdminPayout } from "@/lib/api/admin"
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
  { id: "requested", label: "Requested" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
  { id: "rejected", label: "Rejected" },
]

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState("requested")
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, loading, error, reload } = useAdminQuery(
    () => fetchAdminPayouts({ page, limit: 20, status: tab }),
    [tab, page],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  const act = async (id: string, action: "processing" | "complete" | "reject") => {
    setBusyId(id)
    try {
      await processAdminPayout(id, action)
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Creator payouts"
        description="Approve manual withdrawals after off-platform transfer."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Payouts" }]}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/payouts/history">History</Link>
          </Button>
        }
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
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
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
                <TableCell className="text-right">
                  {p.status === "requested" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={busyId === p.id}
                        onClick={() => void act(p.id, "processing")}
                      >
                        Mark processing
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={busyId === p.id}
                        onClick={() => void act(p.id, "complete")}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-destructive"
                        disabled={busyId === p.id}
                        onClick={() => void act(p.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {p.status === "processing" && (
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={busyId === p.id}
                      onClick={() => void act(p.id, "complete")}
                    >
                      Complete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
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
