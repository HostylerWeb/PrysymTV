"use client"

import Link from "next/link"
import { AdminDeleteButton } from "@/components/admin/admin-confirm-dialog"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminVideoListItem } from "@/lib/api/admin"

export function AdminVideoTable({
  items,
  onDelete,
  onEdit,
}: {
  items: AdminVideoListItem[]
  onDelete?: (id: string) => void | Promise<void>
  onEdit?: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
        No items match your filters.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Likes</TableHead>
            <TableHead className="text-right">Comments</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium max-w-[200px]">
                <p className="truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground font-mono">{v.id}</p>
              </TableCell>
              <TableCell>
                <Link href={`/admin/users/${v.creatorId}`} className="text-primary hover:underline text-sm">
                  {v.creator}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{v.category}</TableCell>
              <TableCell className="text-right tabular-nums">{v.views.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums">{v.likes.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums">{v.comments}</TableCell>
              <TableCell>
                <AdminStatusPill status={v.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => onEdit(v.id)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link href={v.siteHref}>View</Link>
                  </Button>
                  <AdminDeleteButton
                    itemLabel={v.title}
                    onConfirm={onDelete ? () => void onDelete(v.id) : undefined}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
