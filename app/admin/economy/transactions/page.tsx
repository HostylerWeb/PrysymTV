"use client"

import { useState } from "react"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import { useAdminListDateFilter } from "@/components/admin/use-admin-list-date-filter"
import { fetchAdminTransactions } from "@/lib/api/admin"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TABS = [
  { id: "all", label: "All" },
  { id: "purchase_coins", label: "Coin purchases" },
  { id: "subscription", label: "Subscriptions" },
  { id: "payout", label: "Payouts" },
]

export default function AdminEconomyTransactionsPage() {
  const [tab, setTab] = useState("all")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const { dateRange, setDateRange, dateParams, dateDeps } = useAdminListDateFilter()

  const { data, loading, error } = useAdminQuery(
    () =>
      fetchAdminTransactions({
        page,
        limit: 20,
        type: tab === "all" ? undefined : tab,
        q: q || undefined,
        ...dateParams,
      }),
    [tab, page, q, ...dateDeps],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Transactions"
        description="Coin purchases, subscriptions, and payouts from the ledger."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Economy", href: "/admin/economy" },
          { label: "Transactions" },
        ]}
      />

      <AdminFilterBar tabs={TABS} activeTab={tab} onTabChange={(t) => { setTab(t); setPage(1) }} />

      <AdminDateRangePicker
        className="mb-4"
        value={dateRange}
        onChange={setDateRange}
        allowClear
      />

      <div className="mb-4">
        <Input
          placeholder="Search username…"
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
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.id.slice(0, 8)}…</TableCell>
                <TableCell className="capitalize">{t.type.replace(/_/g, " ")}</TableCell>
                <TableCell>{t.user}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {t.coins ? `${t.coins} coins` : `$${t.amountUsd}`}
                </TableCell>
                <TableCell>
                  <AdminStatusPill status={t.status} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(t.createdAt).toLocaleDateString()}
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
