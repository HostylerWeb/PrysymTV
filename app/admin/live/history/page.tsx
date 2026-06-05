"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminStreamHistory } from "@/lib/api/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminLiveHistoryPage() {
  const [page, setPage] = useState(1)

  const { data, loading, error } = useAdminQuery(
    () => fetchAdminStreamHistory({ page, limit: 20 }),
    [page],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Stream history"
        description="Recently ended streams."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Live", href: "/admin/live" },
          { label: "History" },
        ]}
      />

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading stream history…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Ended</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                  No ended streams yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.title}</TableCell>
                  <TableCell>{s.creator}</TableCell>
                  <TableCell>{s.duration}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(s.endedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <AdminStatusPill status={s.status} />
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
