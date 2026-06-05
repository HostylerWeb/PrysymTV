"use client"

import { useState } from "react"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { deleteAdminComment, fetchAdminContentComments } from "@/lib/api/admin"
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

export default function AdminContentCommentsPage() {
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useAdminQuery(
    () => fetchAdminContentComments({ page, limit: 20, q: q || undefined }),
    [page, q],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title="Comments"
        description="Global comment moderation — hide spam, review reported threads."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content", href: "/admin/content" },
          { label: "Comments" },
        ]}
      />

      <div className="mb-4">
        <Input
          placeholder="Search comment, author, or target…"
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
              <TableHead>Comment</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>On</TableHead>
              <TableHead className="text-right">Likes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="max-w-[240px]">
                  <p className="text-sm line-clamp-2">{c.body}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{c.id}</p>
                </TableCell>
                <TableCell>{c.author}</TableCell>
                <TableCell>
                  <p className="text-sm truncate max-w-[140px]">{c.targetTitle}</p>
                </TableCell>
                <TableCell className="text-right">{c.likes}</TableCell>
                <TableCell>
                  <AdminStatusPill status={c.status} />
                </TableCell>
                <TableCell className="text-right">
                  <AdminConfirmDialog
                    title="Delete comment?"
                    description="Permanently removes this comment."
                    confirmLabel="Delete"
                    onConfirm={() => void deleteAdminComment(c.id).then(() => reload())}
                    trigger={
                      <Button size="sm" variant="outline" className="rounded-full text-destructive border-destructive/30">
                        Delete
                      </Button>
                    }
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
