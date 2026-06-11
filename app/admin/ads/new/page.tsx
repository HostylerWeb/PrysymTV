"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  AD_CAMPAIGN_REVENUE_RULE_KEY,
  AD_CAMPAIGN_REVENUE_RULE_LABEL,
} from "@/lib/admin/ad-campaign-constants"
import {
  createAdminAdCampaign,
  fetchAdminAdvertisers,
  initAdminAdMediaUpload,
} from "@/lib/api/admin"
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

export default function AdminAdsNewPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    advertiserName: "",
    title: "",
    mediaUrl: "",
    clickThroughUrl: "",
    placement: "home_banner",
    targetImpressions: "100000",
    budgetUsd: "5000",
    startsAt: "",
    endsAt: "",
    status: "draft" as "draft" | "active",
    advertiserAccountId: "",
  })

  const { data: advertisers } = useAdminQuery(fetchAdminAdvertisers, [])

  const uploadMedia = async (file: File) => {
    setUploadBusy(true)
    setError(null)
    try {
      const init = await initAdminAdMediaUpload({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      })
      const put = await fetch(init.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!put.ok) throw new Error("Upload failed")
      setForm((f) => ({ ...f, mediaUrl: init.publicUrl }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploadBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const selectedAdvertiser = (advertisers ?? []).find(
        (a) => a.id === form.advertiserAccountId,
      )
      const campaign = await createAdminAdCampaign({
        advertiserName: selectedAdvertiser?.companyName ?? form.advertiserName,
        title: form.title,
        mediaUrl: form.mediaUrl,
        clickThroughUrl: form.clickThroughUrl,
        placement: form.placement,
        targetImpressions: parseInt(form.targetImpressions, 10),
        budgetUsd: parseFloat(form.budgetUsd),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        status: form.status,
        revenueRuleKey: AD_CAMPAIGN_REVENUE_RULE_KEY,
        advertiserAccountId: form.advertiserAccountId || undefined,
      })
      router.push(`/admin/ads/${(campaign as { id: string }).id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Create campaign"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Ads", href: "/admin/ads" },
          { label: "New" },
        ]}
      />

      <form onSubmit={(e) => void submit(e)} className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="advertiser">Advertiser name</Label>
            <Input
              id="advertiser"
              className="mt-1"
              required
              value={form.advertiserName}
              onChange={(e) => setForm((f) => ({ ...f, advertiserName: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="title">Campaign title</Label>
            <Input
              id="title"
              className="mt-1"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label>Advertiser account</Label>
          <Select
            value={form.advertiserAccountId || "none"}
            onValueChange={(v) => {
              const id = v === "none" ? "" : v
              const account = (advertisers ?? []).find((a) => a.id === id)
              setForm((f) => ({
                ...f,
                advertiserAccountId: id,
                advertiserName: account?.companyName ?? f.advertiserName,
              }))
            }}
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
            When this ad is shown, impression revenue uses{" "}
            <span className="font-medium text-foreground">{AD_CAMPAIGN_REVENUE_RULE_LABEL}</span>{" "}
            (<span className="font-mono text-xs">{AD_CAMPAIGN_REVENUE_RULE_KEY}</span>).
            Change platform / GAF percentages under{" "}
            <Link href="/admin/config/revenue" className="text-primary underline">
              Configuration → Revenue
            </Link>
            .
          </p>
        </div>
        <div>
          <Label htmlFor="media">Media URL</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="media"
              type="url"
              required
              value={form.mediaUrl}
              onChange={(e) => setForm((f) => ({ ...f, mediaUrl: e.target.value }))}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void uploadMedia(file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-full shrink-0"
              disabled={uploadBusy}
              onClick={() => fileRef.current?.click()}
            >
              {uploadBusy ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="click">Click-through URL</Label>
          <Input
            id="click"
            type="url"
            className="mt-1"
            required
            value={form.clickThroughUrl}
            onChange={(e) => setForm((f) => ({ ...f, clickThroughUrl: e.target.value }))}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Placement</Label>
            <Select
              value={form.placement}
              onValueChange={(v) => setForm((f) => ({ ...f, placement: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home_banner">Home banner</SelectItem>
                <SelectItem value="shorts_interstitial">Shorts interstitial</SelectItem>
                <SelectItem value="movie_preroll">Movie preroll</SelectItem>
                <SelectItem value="vertical_episode">Vertical episode</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="impressions">Target impressions</Label>
            <Input
              id="impressions"
              type="number"
              className="mt-1"
              required
              value={form.targetImpressions}
              onChange={(e) => setForm((f) => ({ ...f, targetImpressions: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="budget">Budget (USD)</Label>
            <Input
              id="budget"
              type="number"
              className="mt-1"
              required
              value={form.budgetUsd}
              onChange={(e) => setForm((f) => ({ ...f, budgetUsd: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="start">Start date</Label>
            <Input
              id="start"
              type="date"
              className="mt-1"
              required
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="end">End date</Label>
            <Input
              id="end"
              type="date"
              className="mt-1"
              required
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label>Initial status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v as "draft" | "active" }))}
          >
            <SelectTrigger className="mt-1 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="rounded-full" disabled={busy}>
            {busy ? "Creating…" : "Create campaign"}
          </Button>
          <Button asChild type="button" variant="outline" className="rounded-full">
            <Link href="/admin/ads">Cancel</Link>
          </Button>
        </div>
      </form>
    </>
  )
}
