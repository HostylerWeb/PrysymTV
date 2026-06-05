"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminRevenueLedger } from "@/lib/api/admin"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminRevenueLedgerPage() {
  const [page, setPage] = useState(1)

  const { data, loading, error } = useAdminQuery(
    () => fetchAdminRevenueLedger({ page, limit: 20 }),
    [page],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Revenue ledger"
        description="Read-only batch history from revenue split processing."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Revenue", href: "/admin/revenue" },
          { label: "Ledger" },
        ]}
      />

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading ledger…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch</TableHead>
              <TableHead>Rule</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Gross USD</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                  No ledger batches yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}…</TableCell>
                  <TableCell>{b.ruleKey}</TableCell>
                  <TableCell className="capitalize">{b.sourceType.replace(/_/g, " ")}</TableCell>
                  <TableCell>${b.grossUsd.toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(b.createdAt).toLocaleString()}
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
