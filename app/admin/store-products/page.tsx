"use client"

import { useState } from "react"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminStoreProducts } from "@/lib/api/admin"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminStoreProductsPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")

  const { data, loading, error } = useAdminQuery(
    () => fetchAdminStoreProducts({ page, limit: 20, q: q || undefined }),
    [page, q],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Store products"
        description="All physical and digital products listed by approved Creator Store sellers."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Store products" }]}
      />

      <div className="mb-4 max-w-md">
        <Input
          placeholder="Search product or creator…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          className="rounded-full"
        />
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading products…</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{p.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/users/${p.creatorId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    @{p.creatorUsername}
                  </Link>
                </TableCell>
                <TableCell className="text-sm capitalize">
                  {p.productType === "merchandise" ? "Physical" : p.productType}
                </TableCell>
                <TableCell>${p.priceUsd.toFixed(2)}</TableCell>
                <TableCell>{p.inventory ?? "—"}</TableCell>
                <TableCell>
                  <AdminStatusPill status={p.status === "active" ? "active" : "pending"} />
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
