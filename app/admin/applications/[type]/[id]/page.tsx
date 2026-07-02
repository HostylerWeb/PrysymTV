"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  fetchAdminStoreCreatorApplication,
  fetchAdminStreamerApplication,
  fetchAdminVerticalCreatorApplication,
  reviewAdminStoreCreatorApplication,
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
          : type === "vertical"
            ? "bg-violet-500/15 text-violet-400"
            : "bg-amber-500/15 text-amber-500",
      )}
    >
      {type === "streamer"
        ? "Live streaming"
        : type === "vertical"
          ? "Vertical series"
          : "Creator Store"}
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
  const isStore = type === "store"

  type ApplicationDetail =
    | Awaited<ReturnType<typeof fetchAdminStreamerApplication>>
    | Awaited<ReturnType<typeof fetchAdminVerticalCreatorApplication>>
    | Awaited<ReturnType<typeof fetchAdminStoreCreatorApplication>>

  const { data: app, loading, error } = useAdminQuery<ApplicationDetail>(
    () => {
      if (isStreamer) return fetchAdminStreamerApplication(id)
      if (isStore) return fetchAdminStoreCreatorApplication(id)
      return fetchAdminVerticalCreatorApplication(id)
    },
    [id, isStreamer, isStore],
  )

  const review = async (action: "approve" | "reject") => {
    setBusy(true)
    try {
      if (isStreamer) {
        await reviewAdminStreamerApplication(id, { action, notes: notes || undefined })
      } else if (isStore) {
        await reviewAdminStoreCreatorApplication(id, { action, notes: notes || undefined })
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

  if (type !== "streamer" && type !== "vertical" && type !== "store") {
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

  const storeApp =
    isStore && app && "acceptedTerms" in app
      ? (app as Awaited<ReturnType<typeof fetchAdminStoreCreatorApplication>>)
      : null

  return (
    <>
      <AdminPageHeader
        title="Review application"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Applications", href: "/admin/applications" },
          { label: app.username },
        ]}
        actions={<ApplicationTypePill type={type} />}
      />

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border p-5 space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">User:</span>{" "}
            <Link href={`/admin/users/${app.userId}`} className="text-primary hover:underline">
              @{app.username}
            </Link>
          </p>
          {"email" in app && app.email && (
            <p>
              <span className="text-muted-foreground">Email:</span> {app.email}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Status:</span> {app.status}
          </p>
          <p>
            <span className="text-muted-foreground">Submitted:</span>{" "}
            {new Date(app.submittedAt ?? (app as { createdAt?: string }).createdAt ?? "").toLocaleString()}
          </p>
          {storeApp?.acceptedTerms && (
            <p className="text-amber-600 dark:text-amber-400">
              Applicant acknowledged Terms of Service and Community Guidelines for store access.
            </p>
          )}
          <div>
            <p className="text-muted-foreground mb-1">Description</p>
            <p className="whitespace-pre-wrap">{app.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Review notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-24"
          />
        </div>

        <div className="flex gap-3">
          <Button
            className="rounded-full"
            disabled={busy || app.status !== "pending"}
            onClick={() => void review("approve")}
          >
            Approve
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={busy || app.status !== "pending"}
            onClick={() => void review("reject")}
          >
            Reject
          </Button>
        </div>
      </div>
    </>
  )
}
