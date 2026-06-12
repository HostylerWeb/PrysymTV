"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import Link from "next/link"
import {
  AD_CAMPAIGN_REVENUE_RULE_KEY,
  AD_CAMPAIGN_REVENUE_RULE_LABEL,
} from "@/lib/admin/ad-campaign-constants"
import { AdCampaignPerformance } from "@/components/admin/ad-campaign-performance"
import {
  deleteAdminAdCampaign,
  fetchAdminAdCampaign,
  fetchAdminAdvertisers,
  updateAdminAdCampaign,
  updateAdminAdCampaignStatus,
} from "@/lib/api/admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AdminAdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    advertiserName: "",
    mediaUrl: "",
    clickThroughUrl: "",
    placement: "home_banner",
    targetImpressions: "",
    budgetUsd: "",
    advertiserAccountId: "",
  })

  const { data: campaign, loading, error, reload } = useAdminQuery(
    () => fetchAdminAdCampaign(id),
    [id],
  )
  const { data: advertisers } = useAdminQuery(fetchAdminAdvertisers, [])

  useEffect(() => {
    if (!campaign) return
    setForm({
      title: campaign.title,
      advertiserName: campaign.advertiserName,
      mediaUrl: campaign.mediaUrl ?? "",
      clickThroughUrl: campaign.clickThroughUrl ?? "",
      placement: campaign.placement,
      targetImpressions: String(campaign.targetImpressions),
      budgetUsd: String(campaign.budgetUsd),
      advertiserAccountId: campaign.advertiserAccountId ?? "",
    })
  }, [campaign])

  const setStatus = async (status: "active" | "paused") => {
    setBusy(true)
    try {
      await updateAdminAdCampaignStatus(id, status)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    setSaveBusy(true)
    setMessage(null)
    try {
      await updateAdminAdCampaign(id, {
        title: form.title,
        advertiserName: form.advertiserName,
        mediaUrl: form.mediaUrl,
        clickThroughUrl: form.clickThroughUrl,
        placement: form.placement,
        targetImpressions: parseInt(form.targetImpressions, 10),
        budgetUsd: parseFloat(form.budgetUsd),
        revenueRuleKey: AD_CAMPAIGN_REVENUE_RULE_KEY,
        advertiserAccountId: form.advertiserAccountId || null,
      })
      await reload()
      setMessage("Campaign saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaveBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading campaign…</p>
  }

  if (error || !campaign) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Not found"}</p>
  }

  const budget = Number(campaign.budgetUsd)

  return (
    <>
      <AdminPageHeader
        title={campaign.title}
        description={campaign.advertiserName}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Ads", href: "/admin/ads" },
          { label: campaign.id },
        ]}
        actions={<AdminStatusPill status={campaign.status} />}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-secondary/30 p-4">
              <p className="text-muted-foreground">Budget</p>
              <p className="text-xl font-bold">${budget.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-4">
              <p className="text-muted-foreground">Placement</p>
              <p className="font-medium capitalize">{campaign.placement.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={busy || campaign.status === "paused"}
              onClick={() => void setStatus("paused")}
            >
              Pause
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={busy || campaign.status === "active"}
              onClick={() => void setStatus("active")}
            >
              Resume
            </Button>
            <AdminConfirmDialog
              title="Delete campaign?"
              description="Permanently removes this campaign and its delivery stats."
              confirmLabel="Delete"
              onConfirm={async () => {
                setDeleteBusy(true)
                try {
                  await deleteAdminAdCampaign(id)
                  router.push("/admin/ads")
                } finally {
                  setDeleteBusy(false)
                }
              }}
              trigger={
                <Button variant="destructive" className="rounded-full" disabled={deleteBusy}>
                  Delete campaign
                </Button>
              }
            />
          </div>
        </TabsContent>
        <TabsContent value="edit" className="mt-4 space-y-4 max-w-2xl">
          <div>
            <Label htmlFor="title">Campaign title</Label>
            <Input
              id="title"
              className="mt-1"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="advertiser">Advertiser name</Label>
            <Input
              id="advertiser"
              className="mt-1"
              value={form.advertiserName}
              onChange={(e) => setForm((f) => ({ ...f, advertiserName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Advertiser account</Label>
            <Select
              value={form.advertiserAccountId || "none"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, advertiserAccountId: v === "none" ? "" : v }))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Optional linked account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(advertisers ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Ad revenue split</p>
            <p className="text-muted-foreground mt-1">
              Impression revenue uses{" "}
              <span className="font-medium text-foreground">{AD_CAMPAIGN_REVENUE_RULE_LABEL}</span>.
              Edit percentages under{" "}
              <Link href="/admin/config/revenue" className="text-primary underline">
                Configuration → Revenue
              </Link>
              .
            </p>
          </div>
          <div>
            <Label htmlFor="media">Media URL</Label>
            <Input
              id="media"
              type="url"
              className="mt-1"
              value={form.mediaUrl}
              onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="click">Click-through URL</Label>
            <Input
              id="click"
              type="url"
              className="mt-1"
              value={form.clickThroughUrl}
              onChange={(e) => setForm((f) => ({ ...f, clickThroughUrl: e.target.value }))}
            />
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button className="rounded-full" disabled={saveBusy} onClick={() => void save()}>
            {saveBusy ? "Saving…" : "Save changes"}
          </Button>
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <AdCampaignPerformance campaign={campaign} />
        </TabsContent>
      </Tabs>
    </>
  )
}
