"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import { useAdminListDateFilter } from "@/components/admin/use-admin-list-date-filter"
import { fetchAdminGafLedger } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminGafPage() {
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState<"" | "inflow" | "outflow">("")
  const { dateRange, setDateRange, dateParams, dateDeps } = useAdminListDateFilter()

  const { data, loading, error } = useAdminQuery(
    () =>
      fetchAdminGafLedger({
        page,
        limit: 30,
        direction: direction || undefined,
        ...dateParams,
      }),
    [page, direction, ...dateDeps],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 30, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="GAF ledger"
        description="Global Advancement Fund inflows and outflows."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "GAF" }]}
      />

      {data?.summary && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total inflow</p>
            <p className="text-2xl font-bold">${data.summary.totalInflowUsd.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total outflow</p>
            <p className="text-2xl font-bold">${data.summary.totalOutflowUsd.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-2xl font-bold">${data.summary.balanceUsd.toLocaleString()}</p>
          </div>
        </div>
      )}

      <AdminDateRangePicker
        className="mb-4"
        value={dateRange}
        onChange={setDateRange}
        allowClear
      />

      <div className="flex gap-2 mb-4">
        {(["", "inflow", "outflow"] as const).map((d) => (
          <Button
            key={d || "all"}
            size="sm"
            variant={direction === d ? "default" : "outline"}
            className="rounded-full capitalize"
            onClick={() => {
              setDirection(d)
              setPage(1)
            }}
          >
            {d || "All"}
          </Button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading ledger…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Direction</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No GAF ledger entries yet.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="capitalize">{row.direction}</TableCell>
                  <TableCell className="capitalize">{row.source.replace(/_/g, " ")}</TableCell>
                  <TableCell className="capitalize">
                    {row.programCategory?.replace(/_/g, " ") ?? "—"}
                  </TableCell>
                  <TableCell>${Number(row.amountUsd).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(row.createdAt).toLocaleString()}
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
