"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminReportPreview } from "@/components/admin/admin-report-preview"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminReport, reviewAdminReport } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  const { data: report, loading, error } = useAdminQuery(() => fetchAdminReport(id), [id])

  const runAction = async (action: "dismiss" | "delete_content" | "ban_user") => {
    setBusy(true)
    try {
      await reviewAdminReport(id, { action, notes: notes || undefined })
      router.push("/admin/moderation")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading report…</p>
  }

  if (error || !report) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Report not found"}</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Report review"
        description={report.id}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Moderation", href: "/admin/moderation" },
          { label: report.id },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <AdminReportPreview
            targetType={report.targetType}
            targetTitle={report.target.title}
            targetId={report.targetId}
            reason={report.reason}
            excerpt={report.target.excerpt ?? undefined}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <AdminStatusPill status={report.status} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reason</span>
              <span className="capitalize">{report.reason}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reporter</span>
              <span>@{report.reporter.username}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Label htmlFor="notes">Review notes (internal)</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes for audit log…"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex flex-col gap-2 pt-2">
              <AdminConfirmDialog
                title="Dismiss report?"
                description="No action will be taken against the content or user."
                confirmLabel="Dismiss"
                variant="default"
                onConfirm={() => void runAction("dismiss")}
                trigger={
                  <Button variant="outline" className="rounded-full w-full" disabled={busy}>
                    Dismiss report
                  </Button>
                }
              />
              <AdminConfirmDialog
                title="Delete reported content?"
                description="Removes the content from the platform."
                confirmLabel="Delete content"
                onConfirm={() => void runAction("delete_content")}
                trigger={
                  <Button variant="outline" className="rounded-full w-full" disabled={busy}>
                    Delete content
                  </Button>
                }
              />
              <AdminConfirmDialog
                title="Ban user?"
                description="Permanently bans the account associated with this content."
                confirmLabel="Ban user"
                onConfirm={() => void runAction("ban_user")}
                trigger={
                  <Button variant="destructive" className="rounded-full w-full" disabled={busy}>
                    Ban user
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
