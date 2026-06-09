"use client"

import { useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminVideoTable } from "@/components/admin/admin-video-table"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { deleteAdminVideo, fetchAdminContentVideos } from "@/lib/api/admin"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  title: string;
  description: string;
  breadcrumbLabel: string;
  videoType: "video" | "short" | "movie";
  headerActions?: React.ReactNode;
};

export function AdminContentVideoPage({
  title,
  description,
  breadcrumbLabel,
  videoType,
  headerActions,
}: Props) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useAdminQuery(
    () =>
      fetchAdminContentVideos({
        page,
        limit: 20,
        type: videoType,
        q: q || undefined,
        status: status === "all" ? undefined : status === "published" ? "ready" : status,
      }),
    [page, q, status, videoType],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  return (
    <>
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Content", href: "/admin/content" },
          { label: breadcrumbLabel },
        ]}
        actions={headerActions}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search title, creator, or ID…"
          className="max-w-sm"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading…</p>}

      <AdminVideoTable
        items={items}
        onDelete={(id) => deleteAdminVideo(id).then(() => reload())}
      />
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
