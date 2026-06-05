"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { fetchAdminLiveStreams, killAdminStream } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminLivePage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAdminLiveStreams>>["items"]>([])
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    void fetchAdminLiveStreams()
      .then((res) => {
        setItems(res.items)
        setError(null)
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load")
      })
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [])

  const handleKill = async (id: string) => {
    await killAdminStream(id)
    load()
  }

  return (
    <>
      <AdminPageHeader
        title="Live operations"
        description="Monitor active streams. Force-stop abusive broadcasts."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Live" }]}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/live/history">Stream history</Link>
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground mb-4">Auto-refreshes every 10s.</p>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stream</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Viewers</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No live streams
                </TableCell>
              </TableRow>
            ) : (
              items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{s.title}</TableCell>
                  <TableCell>{s.creator}</TableCell>
                  <TableCell>{s.viewers}</TableCell>
                  <TableCell>{s.category}</TableCell>
                  <TableCell>
                    <AdminStatusPill status="live" />
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminConfirmDialog
                      title="Kill stream?"
                      description="Ends the broadcast immediately for all viewers."
                      confirmLabel="Kill stream"
                      onConfirm={() => void handleKill(s.id)}
                      trigger={
                        <Button size="sm" variant="destructive" className="rounded-full">
                          Kill
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
