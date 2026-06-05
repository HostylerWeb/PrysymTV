"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminStreamerApplication, reviewAdminStreamerApplication } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AdminStreamerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  const { data: app, loading, error } = useAdminQuery(
    () => fetchAdminStreamerApplication(id),
    [id],
  )

  const review = async (action: "approve" | "reject") => {
    setBusy(true)
    try {
      await reviewAdminStreamerApplication(id, { action, notes: notes || undefined })
      router.push("/admin/streamers")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading application…</p>
  }

  if (error || !app) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Not found"}</p>
  }

  return (
    <>
      <AdminPageHeader
        title={app.displayName ?? app.username}
        description={`@${app.username}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Streamers", href: "/admin/streamers" },
          { label: app.username },
        ]}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/admin/users/${app.userId}`}>User profile</Link>
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium mb-2">Application</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium mb-3">ID document</p>
            {app.idDocumentUrl ? (
              <img
                src={app.idDocumentUrl}
                alt="ID document"
                className="w-full rounded-lg border border-border"
              />
            ) : (
              <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                No document uploaded
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4 h-fit">
          <div>
            <Label htmlFor="review-notes">Review notes (internal)</Label>
            <Textarea
              id="review-notes"
              className="mt-1"
              rows={4}
              placeholder="Optional…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="rounded-full"
              disabled={busy || app.status !== "pending"}
              onClick={() => void review("approve")}
            >
              Approve streamer
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={busy || app.status !== "pending"}
              onClick={() => void review("reject")}
            >
              Reject application
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
