"use client"

import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminRevenueRules } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function bpsToPct(bps: number) {
  return `${(bps / 100).toFixed(1)}%`
}

export default function AdminRevenuePage() {
  const { data: rules, loading, error } = useAdminQuery(fetchAdminRevenueRules, [])

  return (
    <>
      <AdminPageHeader
        title="Revenue splits"
        description="Stakeholder percentages — changes apply to new transactions only."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Revenue" }]}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/revenue/ledger">View ledger</Link>
          </Button>
        }
      />

      <div className="mb-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-200/90">
        Past ledger batches are immutable. Edit rules in{" "}
        <Link href="/admin/config/revenue" className="underline">
          Configuration → Revenue
        </Link>
        .
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading rules…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>GAF</TableHead>
              <TableHead>Creator dev fund</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rules ?? []).map((r) => (
              <TableRow key={r.ruleKey}>
                <TableCell>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.ruleKey}</p>
                </TableCell>
                <TableCell>{bpsToPct(r.creatorBps)}</TableCell>
                <TableCell>{bpsToPct(r.platformBps)}</TableCell>
                <TableCell>{bpsToPct(r.gafBps)}</TableCell>
                <TableCell>{bpsToPct(r.creatorDevFundBps)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href="/admin/config/revenue">Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
