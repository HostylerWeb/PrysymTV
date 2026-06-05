"use client"

import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminAdCampaigns } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminAdsPage() {
  const { data: campaigns, loading, error } = useAdminQuery(fetchAdminAdCampaigns, [])

  return (
    <>
      <AdminPageHeader
        title="Ad campaigns"
        description="Private ad network — create and monitor campaigns."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Ads" }]}
        actions={
          <Button asChild className="rounded-full">
            <Link href="/admin/ads/new">New campaign</Link>
          </Button>
        }
      />

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading campaigns…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(campaigns ?? []).map((c) => {
              const delivered = c.deliveredImpressions
              const target = c.targetImpressions || 1
              const pct = Math.round((delivered / target) * 100)
              const ctr = delivered > 0 ? ((c.clicks / delivered) * 100).toFixed(2) : "0.00"
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.advertiserName}</p>
                  </TableCell>
                  <TableCell className="text-sm capitalize">{c.placement.replace(/_/g, " ")}</TableCell>
                  <TableCell className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{ctr}%</TableCell>
                  <TableCell>
                    <AdminStatusPill status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={`/admin/ads/${c.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
