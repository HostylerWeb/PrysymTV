"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminApplications, type AdminApplicationType } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
]

const TYPE_FILTERS: Array<{ id: "all" | AdminApplicationType; label: string }> = [
  { id: "all", label: "All types" },
  { id: "streamer", label: "Live streaming" },
  { id: "vertical", label: "Vertical series" },
  { id: "store", label: "Creator Store" },
]

function ApplicationTypePill({ type }: { type: AdminApplicationType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        type === "streamer"
          ? "bg-green-500/15 text-green-500"
          : type === "vertical"
            ? "bg-violet-500/15 text-violet-400"
            : "bg-amber-500/15 text-amber-500",
      )}
    >
      {type === "streamer" ? "Live" : type === "vertical" ? "Vertical" : "Store"}
    </span>
  )
}

export default function AdminApplicationsPage() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get("type")
  const [tab, setTab] = useState("pending")
  const [typeFilter, setTypeFilter] = useState<"all" | AdminApplicationType>(
    initialType === "streamer" || initialType === "vertical" || initialType === "store"
      ? initialType
      : "all",
  )
  const [page, setPage] = useState(1)

  const queryType = typeFilter === "all" ? undefined : typeFilter

  const { data, loading, error } = useAdminQuery(
    () =>
      fetchAdminApplications({
        page,
        limit: 20,
        status: tab === "all" ? undefined : tab,
        type: queryType,
      }),
    [tab, page, queryType],
  )

  const items = data?.items ?? []
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0 }
  const totalPages = Math.ceil(meta.total / meta.limit) || 1

  const pendingByUser = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      if (item.status !== "pending") continue
      map.set(item.userId, (map.get(item.userId) ?? 0) + 1)
    }
    return map
  }, [items])

  return (
    <>
      <AdminPageHeader
        title="Applications"
        description="Review live streaming, vertical series, and Creator Store access in one queue."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Applications" }]}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setTypeFilter(f.id)
              setPage(1)
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
              typeFilter === f.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminFilterBar
        tabs={STATUS_TABS}
        activeTab={tab}
        onTabChange={(t) => {
          setTab(t)
          setPage(1)
        }}
      />

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      {loading && (
        <p className="text-sm text-muted-foreground mb-4">Loading applications…</p>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                  No applications in this view.
                </TableCell>
              </TableRow>
            ) : (
              items.map((a) => (
                <TableRow key={`${a.type}-${a.id}`}>
                  <TableCell>
                    <ApplicationTypePill type={a.type} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{a.displayName ?? a.username}</p>
                    <p className="text-xs text-muted-foreground">@{a.username}</p>
                    {(pendingByUser.get(a.userId) ?? 0) > 1 && a.status === "pending" && (
                      <p className="text-[10px] text-amber-500 mt-0.5">
                        Multiple pending requests
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                    {a.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.type === "streamer" ? (
                      a.hasIdDocument ? "ID uploaded" : "No ID"
                    ) : a.portfolioUrl ? (
                      <a
                        href={a.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Portfolio
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <AdminStatusPill status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link href={`/admin/applications/${a.type}/${a.id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
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
