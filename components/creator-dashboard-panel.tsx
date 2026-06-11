"use client"

import { useEffect, useState } from "react"
import { BarChart3, DollarSign, Eye, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import { fetchCreatorDashboard, type CreatorDashboardResponse } from "@/lib/api/analytics"
import { requestCreatorPayout } from "@/lib/api/billing-monetization"
import { formatViewCount } from "@/lib/format-media"

export function CreatorDashboardPanel({ className }: { className?: string }) {
  const [data, setData] = useState<CreatorDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payoutAmount, setPayoutAmount] = useState("50")
  const [payoutMethod, setPayoutMethod] = useState<"paypal" | "bank_transfer" | "crypto">("paypal")
  const [payoutBusy, setPayoutBusy] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const dash = await fetchCreatorDashboard()
        if (!cancelled) setData(dash)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Could not load performance data")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground pt-4">Loading your metrics…</p>
  }
  if (error) {
    return <p className="text-sm text-destructive pt-4">{error}</p>
  }
  if (!data) return null

  const fmtUsd = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n)
      ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "$0.00"
  }

  const perfStats = [
    { label: "Views (24h)", value: formatViewCount(data.performance.views24h), icon: Eye },
    { label: "Views (7d)", value: formatViewCount(data.performance.views7d), icon: TrendingUp },
    { label: "Watch hrs (30d)", value: String(data.performance.watchHours30d), icon: BarChart3 },
    { label: "Earnings (30d)", value: fmtUsd(data.financial.earnings30dUsd), icon: DollarSign },
  ]

  const adStats = [
    {
      label: "Ad views on your content (24h)",
      value: formatViewCount(data.advertising.adImpressionsOnYourContent24h),
    },
    {
      label: "Ad views (30d)",
      value: formatViewCount(data.advertising.adImpressionsOnYourContent30d),
    },
    {
      label: "Ad clicks (30d)",
      value: formatViewCount(data.advertising.adClicksOnYourContent30d),
    },
    { label: "CTR (30d)", value: `${data.advertising.ctr30d}%` },
  ]

  return (
    <div className={className ?? "pt-2 md:pt-3 space-y-6 md:space-y-8"}>
      {data.programVerticals.length > 0 && (
        <p className="text-xs md:text-sm text-muted-foreground">
          Programs: {data.programVerticals.join(", ").replace(/_/g, " ")} · Partner tier:{" "}
          {data.partnerTier}
        </p>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2">Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {perfStats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="p-3 md:p-4 rounded-xl bg-secondary/30 border border-border"
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
                <p className="text-xl md:text-2xl font-bold">{s.value}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{s.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Ads on your videos</h3>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {adStats.map((s) => (
            <div
              key={s.label}
              className="p-3 rounded-xl bg-secondary/20 border border-border text-sm"
            >
              <p className="font-bold">{s.value}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-6">
        <div>
          <h3 className="text-sm md:text-base font-semibold mb-2 md:mb-3">Top content</h3>
          <div className="space-y-2 md:space-y-2.5">
            {data.topContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Upload videos to see stats here.</p>
            ) : (
              data.topContent.map((item, i) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm md:text-base p-2.5 md:p-3 rounded-lg bg-secondary/20 gap-2"
                >
                  <span className="line-clamp-1">
                    #{i + 1} {item.title}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs md:text-sm">
                    {formatViewCount(item.viewsCount)} views · {item.adImpressions30d} ads
                    {(item.dislikesCount ?? 0) > 0
                      ? ` · ${formatViewCount(item.dislikesCount ?? 0)} dislikes`
                      : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 md:p-6 rounded-xl border border-border bg-secondary/20">
            <p className="text-sm font-semibold">Revenue (30d)</p>
            <ul className="text-xs md:text-sm text-muted-foreground mt-2 space-y-1">
              <li>Total earnings: {fmtUsd(data.financial.earnings30dUsd)}</li>
              <li>Ad revenue: {fmtUsd(data.financial.adRevenueUsd)}</li>
              <li>Sponsorships: {fmtUsd(data.financial.sponsorshipRevenueUsd)}</li>
              <li>Merch: {fmtUsd(data.financial.merchandiseRevenueUsd)}</li>
              <li>Donations: {fmtUsd(data.financial.donationsUsd)}</li>
            </ul>
          </div>
          <div className="p-4 md:p-6 rounded-xl border border-border bg-secondary/20 space-y-3">
            <p className="text-sm font-semibold">Available balance</p>
            <p className="text-2xl md:text-3xl font-bold text-primary">
              {fmtUsd(data.financial.pendingPayoutUsd)}
            </p>
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal $50. Payouts are reviewed manually (1–5 business days).
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min={50}
                step={1}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg bg-secondary text-sm"
                placeholder="Amount (USD)"
              />
              <select
                value={payoutMethod}
                onChange={(e) =>
                  setPayoutMethod(e.target.value as "paypal" | "bank_transfer" | "crypto")
                }
                className="h-10 px-2 rounded-lg bg-secondary text-sm"
              >
                <option value="paypal">PayPal</option>
                <option value="bank_transfer">Bank</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <Button
              className="w-full rounded-full"
              disabled={payoutBusy}
              onClick={() => {
                const amount = Number(payoutAmount)
                if (!Number.isFinite(amount) || amount < 50) {
                  setPayoutMessage("Enter at least $50")
                  return
                }
                setPayoutBusy(true)
                setPayoutMessage(null)
                void requestCreatorPayout({ amountUsd: amount, method: payoutMethod })
                  .then((res) => {
                    setPayoutMessage(`Request submitted (${res.payout.status}).`)
                    return fetchCreatorDashboard()
                  })
                  .then((dash) => dash && setData(dash))
                  .catch((e) =>
                    setPayoutMessage(
                      e instanceof ApiError ? e.message : "Could not request payout",
                    ),
                  )
                  .finally(() => setPayoutBusy(false))
              }}
            >
              {payoutBusy ? "Submitting…" : "Request payout"}
            </Button>
            {payoutMessage && (
              <p className="text-xs text-center text-muted-foreground">{payoutMessage}</p>
            )}
          </div>
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
            <p className="text-sm font-semibold">Community impact</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.communityImpact.jobsSupported} jobs · {data.communityImpact.businessesFunded}{" "}
              businesses · {fmtUsd(data.communityImpact.dollarsInvested)} invested
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
