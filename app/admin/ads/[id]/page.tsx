"use client"

import { use, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatusPill } from "@/components/admin/admin-status-pill"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminAdCampaign, updateAdminAdCampaignStatus } from "@/lib/api/admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export default function AdminAdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [busy, setBusy] = useState(false)

  const { data: campaign, loading, error, reload } = useAdminQuery(
    () => fetchAdminAdCampaign(id),
    [id],
  )

  const setStatus = async (status: "active" | "paused") => {
    setBusy(true)
    try {
      await updateAdminAdCampaignStatus(id, status)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading campaign…</p>
  }

  if (error || !campaign) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Not found"}</p>
  }

  const budget = Number(campaign.budgetUsd)
  const delivered = campaign.deliveredImpressions
  const target = campaign.targetImpressions || 1
  const ctr = delivered > 0 ? ((campaign.clicks / delivered) * 100).toFixed(2) : "0.00"

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
          <div className="flex gap-2">
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
          </div>
        </TabsContent>
        <TabsContent value="performance" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            {delivered.toLocaleString()} / {target.toLocaleString()} impressions · {campaign.clicks} clicks · {ctr}% CTR
          </p>
        </TabsContent>
      </Tabs>
    </>
  )
}
