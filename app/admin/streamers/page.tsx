"use client"

import { useState } from "react"
import Link from "next/link"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminStreamerApplications } from "@/lib/api/admin"
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
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
]

export default function AdminStreamersPage() {
  const [tab, setTab] = useState("pending")
  const [page, setPage] = useState(1)

  const { data, loading, error } = useAdminQuery(
    () =>
      fetchAdminStreamerApplications({
        page,
        limit: 20,
        status: tab === "all" ? undefined : tab,
      }),
    [tab, page],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Streamer applications"
        description="Review Go Live requests and ID documents."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Streamers" }]}
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
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading applications…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>ID doc</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <p className="font-medium">{a.displayName ?? a.username}</p>
                  <p className="text-xs text-muted-foreground">@{a.username}</p>
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                  {a.description}
                </TableCell>
                <TableCell>{a.hasIdDocument ? "✓" : "—"}</TableCell>
                <TableCell>
                  <AdminStatusPill status={a.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href={`/admin/streamers/${a.id}`}>Review</Link>
                  </Button>
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
