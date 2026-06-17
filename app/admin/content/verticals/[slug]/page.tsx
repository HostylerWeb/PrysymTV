"use client"

import { use, useState } from "react"
import Link from "next/link"
import { AdminDeleteButton } from "@/components/admin/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { AdminVerticalEpisodeEditSheet } from "@/components/admin/admin-vertical-episode-edit-sheet"
import { AdminVerticalSeriesEditSheet } from "@/components/admin/admin-vertical-series-edit-sheet"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { deleteAdminVerticalEpisode, fetchAdminVerticalEpisodes } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminVerticalEpisodesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [page, setPage] = useState(1)
  const [editEpisodeId, setEditEpisodeId] = useState<string | null>(null)
  const [editSeriesOpen, setEditSeriesOpen] = useState(false)

  const { data, loading, error, reload } = useAdminQuery(
    () => fetchAdminVerticalEpisodes(slug, { page, limit: 20 }),
    [slug, page],
  )

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading episodes…</p>
  }

  if (error || !data) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Not found"}</p>
  }

  const { series, items, meta } = data
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title={series.title}
        description={`${series.episodeCount} episodes · ${series.creator}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content", href: "/admin/content" },
          { label: "Verticals", href: "/admin/content/verticals" },
          { label: series.title },
        ]}
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href={`/verticals/${slug}`}>View series</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setEditSeriesOpen(true)}
            >
              Edit series
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Episode</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Likes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((ep) => (
              <TableRow key={ep.id}>
                <TableCell className="text-muted-foreground">{ep.episodeNumber}</TableCell>
                <TableCell className="font-medium max-w-[220px]">
                  <p className="truncate">{ep.title}</p>
                  <p className="text-xs font-mono text-muted-foreground">{ep.id}</p>
                </TableCell>
                <TableCell className="text-right tabular-nums">{ep.views.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{ep.likes}</TableCell>
                <TableCell>
                  <AdminStatusPill status={ep.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setEditEpisodeId(ep.id)}
                    >
                      Edit
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={ep.siteHref} target="_blank" rel="noopener noreferrer">
                        View
                      </Link>
                    </Button>
                    <AdminDeleteButton
                      itemLabel={ep.title}
                      onConfirm={() => void deleteAdminVerticalEpisode(ep.id).then(() => reload())}
                    />
                  </div>
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

      {editEpisodeId && (
        <AdminVerticalEpisodeEditSheet
          episodeId={editEpisodeId}
          isOpen
          onClose={() => setEditEpisodeId(null)}
          onSuccess={() => void reload()}
        />
      )}
      <AdminVerticalSeriesEditSheet
        slug={slug}
        isOpen={editSeriesOpen}
        onClose={() => setEditSeriesOpen(false)}
        onSuccess={() => void reload()}
      />
    </>
  )
}
