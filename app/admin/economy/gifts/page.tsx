"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import { useAdminListDateFilter } from "@/components/admin/use-admin-list-date-filter"
import { fetchAdminGiftActivity } from "@/lib/api/admin"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminEconomyGiftsPage() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const { dateRange, setDateRange, dateParams, dateDeps } = useAdminListDateFilter()

  const { data, loading, error } = useAdminQuery(
    () =>
      fetchAdminGiftActivity({
        page,
        limit: 20,
        q: q || undefined,
        ...dateParams,
      }),
    [page, q, ...dateDeps],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Gift activity"
        description="Log of gifts sent on live streams, videos, and shorts."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Economy", href: "/admin/economy" },
          { label: "Gift activity" },
        ]}
      />

      <AdminDateRangePicker
        className="mb-4"
        value={dateRange}
        onChange={setDateRange}
        allowClear
      />

      <div className="mb-4">
        <Input
          placeholder="Search sender, recipient, or gift…"
          className="max-w-sm"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
        />
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gift</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Context</TableHead>
              <TableHead className="text-right">Coins</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.giftName}</TableCell>
                <TableCell>{g.sender}</TableCell>
                <TableCell>{g.recipient}</TableCell>
                <TableCell>
                  <span className="capitalize">{g.context}</span>
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{g.contextTitle}</p>
                </TableCell>
                <TableCell className="text-right tabular-nums">{g.coinCost}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(g.createdAt).toLocaleString()}
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
