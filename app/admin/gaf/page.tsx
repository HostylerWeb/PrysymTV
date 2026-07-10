"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDateRangePicker } from "@/components/admin/admin-date-range-picker"
import { useAdminListDateFilter } from "@/components/admin/use-admin-list-date-filter"
import {
  createAdminGafGrant,
  fetchAdminGafLedger,
  fetchAdminGafPrograms,
  type AdminGafProgram,
} from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const CATEGORY_OPTIONS = [
  { value: "economic", label: "Economic development" },
  { value: "workforce", label: "Workforce development" },
  { value: "housing", label: "Housing initiatives" },
  { value: "youth", label: "Youth development" },
] as const

export default function AdminGafPage() {
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState<"" | "inflow" | "outflow">("")
  const { dateRange, setDateRange, dateParams, dateDeps } = useAdminListDateFilter()
  const [programs, setPrograms] = useState<AdminGafProgram[]>([])
  const [grantAmount, setGrantAmount] = useState("")
  const [grantCategory, setGrantCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("economic")
  const [grantProgramId, setGrantProgramId] = useState("")
  const [grantDescription, setGrantDescription] = useState("")
  const [grantSaving, setGrantSaving] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const { data, loading, error } = useAdminQuery(
    () =>
      fetchAdminGafLedger({
        page,
        limit: 30,
        direction: direction || undefined,
        ...dateParams,
      }),
    [page, direction, reloadKey, ...dateDeps],
  )

  useEffect(() => {
    void fetchAdminGafPrograms().then(setPrograms).catch(() => setPrograms([]))
  }, [reloadKey])

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 30, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  const submitGrant = async () => {
    const amountUsd = parseFloat(grantAmount)
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      setGrantError("Enter a valid grant amount.")
      return
    }
    setGrantSaving(true)
    setGrantError(null)
    setGrantSuccess(null)
    try {
      await createAdminGafGrant({
        amountUsd,
        programCategory: grantCategory,
        gafProgramId: grantProgramId || undefined,
        description: grantDescription.trim() || undefined,
      })
      setGrantAmount("")
      setGrantDescription("")
      setGrantSuccess("Grant recorded. It will appear on the public Community Impact page.")
      setReloadKey((k) => k + 1)
    } catch (e) {
      setGrantError(e instanceof Error ? e.message : "Could not record grant")
    } finally {
      setGrantSaving(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="GAF ledger"
        description="Global Advancement Fund inflows (automatic from revenue) and outflows (grants you record here appear on /impact)."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "GAF" }]}
      />

      <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Record a community grant</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Outflows power <strong>Funding by area</strong> and <strong>Recent grants</strong> on the public
            Community Impact page.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="grant-amount">Amount (USD)</Label>
            <Input
              id="grant-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              placeholder="2500.00"
            />
          </div>
          <div>
            <Label htmlFor="grant-category">Program area</Label>
            <select
              id="grant-category"
              value={grantCategory}
              onChange={(e) =>
                setGrantCategory(e.target.value as (typeof CATEGORY_OPTIONS)[number]["value"])
              }
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="grant-program">Linked program (optional)</Label>
            <select
              id="grant-program"
              value={grantProgramId}
              onChange={(e) => setGrantProgramId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">— None —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="grant-description">Description (optional)</Label>
            <Input
              id="grant-description"
              value={grantDescription}
              onChange={(e) => setGrantDescription(e.target.value)}
              placeholder="e.g. Small business equipment grant — Q2 cohort"
            />
          </div>
        </div>
        {grantError ? <p className="text-sm text-destructive">{grantError}</p> : null}
        {grantSuccess ? <p className="text-sm text-green-600 dark:text-green-400">{grantSuccess}</p> : null}
        <Button onClick={() => void submitGrant()} disabled={grantSaving} className="rounded-full">
          {grantSaving ? "Saving…" : "Record grant"}
        </Button>
      </div>

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
