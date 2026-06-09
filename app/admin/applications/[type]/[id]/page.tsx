"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminStreamerApplication,
  fetchAdminVerticalCreatorApplication,
  reviewAdminStreamerApplication,
  reviewAdminVerticalCreatorApplication,
  type AdminApplicationType,
} from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function ApplicationTypePill({ type }: { type: AdminApplicationType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        type === "streamer"
          ? "bg-green-500/15 text-green-500"
          : "bg-violet-500/15 text-violet-400",
      )}
    >
      {type === "streamer" ? "Live streaming" : "Vertical series"}
    </span>
  )
}

export default function AdminApplicationReviewPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const { type: rawType, id } = use(params)
  const type = rawType as AdminApplicationType
  const router = useRouter()
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  const isStreamer = type === "streamer"

  const { data: app, loading, error } = useAdminQuery(
    () =>
      isStreamer
        ? fetchAdminStreamerApplication(id)
        : fetchAdminVerticalCreatorApplication(id),
    [id, isStreamer],
  )

  const review = async (action: "approve" | "reject") => {
    setBusy(true)
    try {
      if (isStreamer) {
        await reviewAdminStreamerApplication(id, { action, notes: notes || undefined })
      } else {
        await reviewAdminVerticalCreatorApplication(id, {
          action,
          notes: notes || undefined,
        })
      }
      router.push("/admin/applications")
    } finally {
      setBusy(false)
    }
  }

  if (type !== "streamer" && type !== "vertical") {
    return (
      <p className="text-sm text-destructive py-12 text-center">Unknown application type.</p>
    )
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">Loading application…</p>
    )
  }

  if (error || !app) {
    return (
      <p className="text-sm text-destructive py-12 text-center">{error ?? "Not found"}</p>
    )
  }

  const approveLabel = isStreamer ? "Approve live streaming" : "Approve vertical series"
  const streamerApp = isStreamer
    ? (app as Awaited<ReturnType<typeof fetchAdminStreamerApplication>>)
    : null
  const verticalApp = !isStreamer
    ? (app as Awaited<ReturnType<typeof fetchAdminVerticalCreatorApplication>>)
    : null

  return (
    <>
      <AdminPageHeader
        title={app.displayName ?? app.username}
        description={`@${app.username}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Applications", href: "/admin/applications" },
          { label: app.username },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ApplicationTypePill type={type} />
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/admin/users/${app.userId}`}>User profile</Link>
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium mb-2">Application</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
          </div>

          {isStreamer && streamerApp && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium mb-3">Government ID</p>
              {streamerApp.idDocumentUrl ? (
                <img
                  src={streamerApp.idDocumentUrl}
                  alt="ID document"
                  className="w-full rounded-lg border border-border"
                />
              ) : (
                <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  No document uploaded
                </div>
              )}
            </div>
          )}

          {!isStreamer && verticalApp && (
            <>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-medium mb-3">Government ID</p>
                {verticalApp.idDocumentUrl ? (
                  <img
                    src={verticalApp.idDocumentUrl}
                    alt="ID document"
                    className="w-full rounded-lg border border-border"
                  />
                ) : (
                  <div className="aspect-[4/3] rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    No document uploaded
                  </div>
                )}
              </div>
              {verticalApp.portfolioUrl && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm font-medium mb-2">Portfolio</p>
                  <a
                    href={verticalApp.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {verticalApp.portfolioUrl}
                  </a>
                </div>
              )}
            </>
          )}
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
              {approveLabel}
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
