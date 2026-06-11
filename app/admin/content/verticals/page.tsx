"use client"

import { useState } from "react"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { AdminDeleteButton } from "@/components/admin/admin-confirm-dialog"
import { deleteAdminVerticalSeries, fetchAdminVerticalSeries } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminContentVerticalsPage() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useAdminQuery(
    () => fetchAdminVerticalSeries({ page, limit: 20, q: q || undefined }),
    [page, q],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Vertical series"
        description="Browse vertical pillar series and drill into episodes."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content", href: "/admin/content" },
          { label: "Verticals" },
        ]}
      />

      <div className="mb-4">
        <Input
          placeholder="Search series or creator…"
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
              <TableHead>Series</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead className="text-right">Episodes</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((s) => (
              <TableRow key={s.slug}>
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell>
                  {s.creatorId ? (
                    <Link href={`/admin/users/${s.creatorId}`} className="text-primary hover:underline text-sm">
                      {s.creator}
                    </Link>
                  ) : (
                    s.creator
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.vertical}</TableCell>
                <TableCell className="text-right">{s.episodeCount}</TableCell>
                <TableCell className="text-right tabular-nums">{s.totalViews.toLocaleString()}</TableCell>
                <TableCell>
                  <AdminStatusPill status={s.status} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href={`/admin/content/verticals/${s.slug}`}>Episodes</Link>
                  </Button>
                  <AdminDeleteButton
                    itemLabel="series"
                    onConfirm={() => void deleteAdminVerticalSeries(s.slug).then(() => reload())}
                  />
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
