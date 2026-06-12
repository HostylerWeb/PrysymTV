"use client"

import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  deliveryProgressValue,
  formatCtr,
  formatDeliveryPercent,
  placementLabel,
} from "@/lib/admin/ad-metrics"
import { fetchAdminAdCampaignAnalytics, type AdCampaign } from "@/lib/api/admin"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

export function AdCampaignPerformance({ campaign }: { campaign: AdCampaign }) {
  const { data, loading, error } = useAdminQuery(
    () => fetchAdminAdCampaignAnalytics(campaign.id),
    [campaign.id],
  )

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8">Loading performance data…</p>
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive py-8">
        {error ?? "Could not load campaign analytics."}
      </p>
    )
  }

  const {
    summary,
    byAudience,
    byPlacement,
    byLocation = [],
    timeline,
    recentEvents,
  } = data
  const deliveryPctLabel = formatDeliveryPercent(
    summary.servedImpressions,
    summary.targetImpressions,
  )
  const ctr = formatCtr(summary.clicks, summary.servedImpressions)

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How delivery works</p>
        <p>
          The <strong>delivery bar</strong> counts each time this ad is <em>served</em> to a viewer
          (when the placement loads the ad). <strong>Clicks</strong> are tracked separately when
          someone taps the ad — clicks do not increase delivery. With a{" "}
          {summary.targetImpressions.toLocaleString()} impression target,{" "}
          {summary.servedImpressions.toLocaleString()} served shows{" "}
          {deliveryPctLabel} progress (not 0% unless nothing was served).
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Delivery &amp; budget</h3>
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold">
                {summary.servedImpressions.toLocaleString()}
                <span className="text-muted-foreground text-lg font-normal">
                  {" "}
                  / {summary.targetImpressions.toLocaleString()} served
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{deliveryPctLabel} of target</p>
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              Placement: {placementLabel(campaign.placement)}
            </p>
          </div>
          <Progress
            value={deliveryProgressValue(
              summary.servedImpressions,
              summary.targetImpressions,
            )}
            className="h-3"
          />
          <div className="grid sm:grid-cols-3 gap-3 pt-2 text-sm">
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p className="font-semibold">${summary.budgetUsd.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Est. spent (CPM ${summary.cpmUsd})</p>
              <p className="font-semibold">${summary.spentUsd.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-semibold">${summary.budgetRemainingUsd.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Clicks" value={summary.clicks.toLocaleString()} />
        <StatCard label="CTR (clicks ÷ served)" value={`${ctr}%`} />
        <StatCard
          label="Tracked impressions"
          value={summary.trackedImpressions.toLocaleString()}
          hint="Pixel events from the player"
        />
        <StatCard
          label="Tracked clicks"
          value={summary.trackedClicks.toLocaleString()}
          hint="Should match campaign clicks"
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Audience (guest vs signed in)</h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audience</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Guests (not logged in)</TableCell>
                <TableCell className="text-right">{byAudience.impressions.guest}</TableCell>
                <TableCell className="text-right">{byAudience.clicks.guest}</TableCell>
                <TableCell className="text-right">
                  {formatCtr(byAudience.clicks.guest, byAudience.impressions.guest)}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Signed-in users</TableCell>
                <TableCell className="text-right">{byAudience.impressions.loggedIn}</TableCell>
                <TableCell className="text-right">{byAudience.clicks.loggedIn}</TableCell>
                <TableCell className="text-right">
                  {formatCtr(byAudience.clicks.loggedIn, byAudience.impressions.loggedIn)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Click locations</h3>
        <p className="text-xs text-muted-foreground">
          City and region come from the viewer&apos;s IP at click time (e.g. Newark, New Jersey).
          Clicks recorded before location tracking was enabled stay as &quot;Unknown location&quot; — try a
          new click on the home banner to verify.
        </p>
        {byLocation.length === 0 ? (
          <p className="text-sm text-muted-foreground">No click location data yet.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byLocation.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>
                      <p className="font-medium text-sm">{row.label}</p>
                      {row.countryCode && row.countryCode !== "US" && (
                        <p className="text-xs text-muted-foreground">{row.countryCode}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.clicks}</TableCell>
                    <TableCell className="text-right">
                      {summary.clicks > 0
                        ? `${((row.clicks / summary.clicks) * 100).toFixed(1)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {byPlacement.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">By placement area</h3>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placement</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byPlacement.map((row) => (
                  <TableRow key={row.placement}>
                    <TableCell>{placementLabel(row.placement)}</TableCell>
                    <TableCell className="text-right">{row.impressions}</TableCell>
                    <TableCell className="text-right">{row.clicks}</TableCell>
                    <TableCell className="text-right">{row.ctrPercent.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Last 30 days</h3>
          <div className="rounded-xl border border-border overflow-hidden max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeline.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-right">{row.impressions}</TableCell>
                    <TableCell className="text-right">{row.clicks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Recent activity</h3>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracked events yet.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Context</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize text-sm">
                      {e.eventType === "ad_click" ? "Click" : "Impression"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.eventType === "ad_click"
                        ? (e.location ?? "Unknown")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{placementLabel(e.placement)}</TableCell>
                    <TableCell className="text-sm capitalize">
                      {e.audience === "logged_in" ? "Signed in" : "Guest"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {e.videoTitle
                        ? `Video: ${e.videoTitle}`
                        : `Platform · ${e.creatorName}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
