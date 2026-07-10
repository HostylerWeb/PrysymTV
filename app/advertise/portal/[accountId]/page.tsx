"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ChevronRight,
  Megaphone,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchAdvertiserCampaignAnalytics,
  fetchMyAdvertiserAccount,
  type AdvertiserAccountDetail,
  type AdvertiserCampaignAnalytics,
} from "@/lib/api/advertisers"
import { profileAuthHref } from "@/lib/safe-return-path"
import { cn } from "@/lib/utils"

function placementLabel(placement: string) {
  return placement.replace(/_/g, " ")
}

function statusClass(status: string) {
  if (status === "active") return "bg-green-500/15 text-green-600 dark:text-green-400"
  if (status === "paused") return "bg-amber-500/15 text-amber-600 dark:text-amber-400"
  return "bg-muted text-muted-foreground"
}

export default function AdvertiserPortalPage({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = use(params)
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [account, setAccount] = useState<AdvertiserAccountDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AdvertiserCampaignAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace(profileAuthHref(`/advertise/portal/${accountId}`, "login"))
      return
    }
    setLoading(true)
    void fetchMyAdvertiserAccount(accountId)
      .then((row) => {
        if (!row.isVerified) {
          router.replace("/advertise")
          return
        }
        setAccount(row)
        if (row.campaigns[0]) {
          setSelectedCampaignId(row.campaigns[0].id)
        }
      })
      .catch(() => setError("Could not load advertiser account."))
      .finally(() => setLoading(false))
  }, [accountId, isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!selectedCampaignId || !account) return
    setAnalyticsLoading(true)
    void fetchAdvertiserCampaignAnalytics(account.id, selectedCampaignId)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false))
  }, [account, selectedCampaignId])

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <Link
          href="/advertise"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Advertise
        </Link>

        {loading && (
          <p className="text-sm text-muted-foreground">Loading advertiser portal…</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {account && (
          <>
            <div className="flex items-start gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  Advertiser portal
                </p>
                <h1 className="text-2xl md:text-3xl font-black">{account.companyName}</h1>
                <p className="text-sm text-muted-foreground mt-1">{account.contactEmail}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
              <section className="lg:col-span-2 space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Campaigns
                </h2>
                {account.campaigns.length === 0 ? (
                  <div className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
                    No campaigns yet. Contact{" "}
                    <a href="mailto:ads@prysym.tv" className="text-primary hover:underline">
                      ads@prysym.tv
                    </a>{" "}
                    to launch your first campaign.
                  </div>
                ) : (
                  account.campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      type="button"
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 transition-colors hover:bg-secondary/40",
                        selectedCampaignId === campaign.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{campaign.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                            {placementLabel(campaign.placement)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            statusClass(campaign.status),
                          )}
                        >
                          {campaign.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {campaign.deliveredImpressions.toLocaleString()} /{" "}
                          {campaign.targetImpressions.toLocaleString()} imps
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </section>

              <section className="lg:col-span-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </h2>

                {!selectedCampaignId && (
                  <p className="text-sm text-muted-foreground">Select a campaign to view metrics.</p>
                )}

                {analyticsLoading && (
                  <p className="text-sm text-muted-foreground">Loading analytics…</p>
                )}

                {analytics && !analyticsLoading && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h3 className="font-bold text-lg mb-1">{analytics.campaign.title}</h3>
                      <p className="text-sm text-muted-foreground capitalize mb-4">
                        {placementLabel(analytics.campaign.placement)} · {analytics.campaign.status}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Impressions</p>
                          <p className="text-xl font-bold">
                            {analytics.summary.servedImpressions.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                          <p className="text-xl font-bold">
                            {analytics.summary.clicks.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">CTR</p>
                          <p className="text-xl font-bold">
                            {analytics.summary.ctrPercent.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Delivery</p>
                          <p className="text-xl font-bold">
                            {analytics.summary.deliveryPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-lg font-bold">
                          ${analytics.summary.budgetUsd.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <p className="text-lg font-bold">
                          ${analytics.summary.spentUsd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-lg font-bold">
                          ${analytics.summary.budgetRemainingUsd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Campaign runs {new Date(analytics.campaign.startsAt).toLocaleDateString()} –{" "}
                      {new Date(analytics.campaign.endsAt).toLocaleDateString()}. CPM basis: $
                      {analytics.summary.cpmUsd.toFixed(2)}.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <div className="mt-10">
              <Button asChild variant="secondary" className="rounded-full">
                <a href="mailto:ads@prysym.tv">Contact account manager</a>
              </Button>
            </div>
          </>
        )}
      </div>

      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
