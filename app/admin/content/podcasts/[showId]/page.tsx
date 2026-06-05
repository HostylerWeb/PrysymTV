"use client"

import { use, useState } from "react"
import Link from "next/link"
import { AdminDeleteButton } from "@/components/admin/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { deleteAdminPodcastEpisode, fetchAdminPodcastEpisodes } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminPodcastEpisodesPage({
  params,
}: {
  params: Promise<{ showId: string }>
}) {
  const { showId } = use(params)
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useAdminQuery(
    () => fetchAdminPodcastEpisodes(showId, { page, limit: 20 }),
    [showId, page],
  )

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading episodes…</p>
  }

  if (error || !data) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Not found"}</p>
  }

  const { show, items, meta } = data
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title={show.title}
        description={`${show.episodeCount} episodes · ${show.creator}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content", href: "/admin/content" },
          { label: "Podcasts", href: "/admin/content/podcasts" },
          { label: show.title },
        ]}
      />

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Episode</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead className="text-right">Plays</TableHead>
              <TableHead className="text-right">Likes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((ep) => (
              <TableRow key={ep.id}>
                <TableCell className="font-medium max-w-[220px]">
                  <p className="truncate">{ep.title}</p>
                  <p className="text-xs font-mono text-muted-foreground">{ep.id}</p>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{ep.durationMin} min</TableCell>
                <TableCell className="text-right tabular-nums">{ep.plays.toLocaleString()}</TableCell>
                <TableCell className="text-right tabular-nums">{ep.likes}</TableCell>
                <TableCell>
                  <AdminStatusPill status={ep.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={ep.siteHref}>View</Link>
                    </Button>
                    <AdminDeleteButton
                      itemLabel={ep.title}
                      onConfirm={() => void deleteAdminPodcastEpisode(ep.id).then(() => reload())}
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
    </>
  )
}
