"use client"

import { useEffect, useState } from "react"
import { BarChart3, DollarSign, Eye, Gift, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import { fetchCreatorDashboard, type CreatorDashboardResponse } from "@/lib/api/analytics"
import { CreatorPayoutSetup } from "@/components/creator-payout-setup"
import {
  fetchCreatorPayoutProfile,
  requestCreatorPayout,
  type CreatorPayoutProfile,
} from "@/lib/api/billing-monetization"
import { formatViewCount } from "@/lib/format-media"

export function CreatorDashboardPanel({ className }: { className?: string }) {
  const [data, setData] = useState<CreatorDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payoutAmount, setPayoutAmount] = useState("50")
  const [payoutProfile, setPayoutProfile] = useState<CreatorPayoutProfile | null>(null)
  const [payoutBusy, setPayoutBusy] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [dash, profile] = await Promise.all([
          fetchCreatorDashboard(),
          fetchCreatorPayoutProfile().catch(() => ({ configured: false as const })),
        ])
        if (!cancelled) {
          setData(dash)
          setPayoutProfile(profile)
        }
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

  const fmtCoins = (n: number) => n.toLocaleString()

  const giftStats = [
    {
      label: "Coins received (30d)",
      value: `🪙 ${fmtCoins(data.gifts.coinsReceived30d)}`,
    },
    {
      label: "Gift value (30d)",
      value: fmtUsd(data.gifts.grossValue30dUsd),
    },
    {
      label: `Your earnings (${data.gifts.creatorSharePercent}%)`,
      value: fmtUsd(data.gifts.earnings30dUsd),
    },
    {
      label: "Gifts received (30d)",
      value: String(data.gifts.giftCount30d),
    },
  ]

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
        <h3 className="text-sm font-semibold mb-2">Gifts &amp; tips</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Viewers send gifts in coins (1 coin = $0.01). You keep{" "}
          {data.gifts.creatorSharePercent}% of each gift; the rest goes to the platform and
          community fund.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
          {giftStats.map((s) => (
            <div
              key={s.label}
              className="p-3 md:p-4 rounded-xl bg-secondary/30 border border-border"
            >
              <Gift className="w-4 h-4 md:w-5 md:h-5 text-primary mb-1 md:mb-2" />
              <p className="text-xl md:text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        {data.gifts.coinsReceivedLifetime > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Lifetime: 🪙 {fmtCoins(data.gifts.coinsReceivedLifetime)} coins (
            {fmtUsd(data.gifts.grossValueLifetimeUsd)} gross) ·{" "}
            {fmtUsd(data.gifts.earningsLifetimeUsd)} earned from{" "}
            {data.gifts.giftCountLifetime} gifts
          </p>
        )}
        {data.gifts.recent.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-3 py-2 bg-secondary/30 border-b border-border">
              <p className="text-xs font-semibold">Recent gifts</p>
            </div>
            <ul className="divide-y divide-border">
              {data.gifts.recent.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {g.giftName}{" "}
                      <span className="text-muted-foreground font-normal">
                        from {g.fromDisplayName ?? `@${g.fromUsername}`}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(g.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">🪙 {fmtCoins(g.coins)}</p>
                    <p className="text-[10px] text-primary">
                      +{fmtUsd(g.creatorEarningsUsd)} ({data.gifts.creatorSharePercent}%)
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No gifts yet. Gifts sent on your videos, shorts, live streams, and profile will
            appear here.
          </p>
        )}
      </div>

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
          <CreatorPayoutSetup
            onConfigured={() => {
              void fetchCreatorPayoutProfile().then(setPayoutProfile)
            }}
          />
          <div className="p-4 md:p-6 rounded-xl border border-border bg-secondary/20">
            <p className="text-sm font-semibold">Revenue (30d)</p>
            <ul className="text-xs md:text-sm text-muted-foreground mt-2 space-y-1">
              <li>Total earnings: {fmtUsd(data.financial.earnings30dUsd)}</li>
              <li>
                Gifts &amp; tips (your {data.gifts.creatorSharePercent}%):{" "}
                {fmtUsd(data.financial.giftsEarnings30dUsd)}
              </li>
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
            {payoutProfile?.configured && (
              <p className="text-xs text-muted-foreground">
                Payouts go to your saved{" "}
                {payoutProfile.method === "bank_transfer"
                  ? "bank account"
                  : payoutProfile.method === "crypto"
                    ? "crypto wallet"
                    : "PayPal"}
                .
              </p>
            )}
            <input
              type="number"
              min={50}
              step={1}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-secondary text-sm"
              placeholder="Amount (USD)"
            />
            <Button
              className="w-full rounded-full"
              disabled={payoutBusy || !payoutProfile?.configured}
              onClick={() => {
                const amount = Number(payoutAmount)
                if (!Number.isFinite(amount) || amount < 50) {
                  setPayoutMessage("Enter at least $50")
                  return
                }
                if (!payoutProfile?.configured) {
                  setPayoutMessage("Set up your payment method above first.")
                  return
                }
                setPayoutBusy(true)
                setPayoutMessage(null)
                void requestCreatorPayout({ amountUsd: amount })
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
            <p className="text-sm font-semibold">Community impact (GAF)</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.communityImpact.jobsSupported} jobs · {data.communityImpact.businessesFunded}{" "}
              businesses · {fmtUsd(data.communityImpact.dollarsInvested)} to the Global Advancement Fund
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              A share of your monetization (gifts, memberships, store sales) funds community programs.
              Impact metrics are updated from your earnings and admin-verified outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
