"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, HeartHandshake, TrendingUp } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { PLATFORM_NAME } from "@/lib/legal/company"
import {
  fetchPublicGafTransparency,
  type PublicGafTransparency,
} from "@/lib/api/gaf"

const CATEGORY_LABELS: Record<string, string> = {
  economic: "Economic development",
  workforce: "Workforce development",
  housing: "Housing initiatives",
  youth: "Youth development",
}

function formatUsd(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ImpactPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [data, setData] = useState<PublicGafTransparency | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchPublicGafTransparency()
      .then(setData)
      .catch(() => setError("Could not load impact data."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <div className="flex items-center gap-2 text-primary mb-4">
          <HeartHandshake className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Community impact</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4">
          Global Advancement Fund
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
          A portion of revenue on {PLATFORM_NAME} flows into the Global Advancement Fund (GAF) to
          support economic development, workforce training, housing, and youth programs in the
          communities we serve.
        </p>

        {loading && (
          <p className="text-sm text-muted-foreground">Loading transparency data…</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {data && (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total inflow</p>
                <p className="text-2xl font-bold mt-1">{formatUsd(data.summary.totalInflowUsd)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Deployed</p>
                <p className="text-2xl font-bold mt-1">{formatUsd(data.summary.totalOutflowUsd)}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Fund balance</p>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {formatUsd(data.summary.balanceUsd)}
                </p>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Program areas
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.programs.map((program) => (
                  <div
                    key={program.id}
                    className="rounded-xl border border-border bg-card/50 p-5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">
                      {CATEGORY_LABELS[program.category] ?? program.category}
                    </p>
                    <h3 className="font-semibold text-foreground">{program.title}</h3>
                    {program.description && (
                      <p className="text-sm text-muted-foreground mt-2">{program.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {data.fundingByCategory.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-bold mb-4">Funding by area</h2>
                <div className="space-y-2">
                  {data.fundingByCategory.map((row) => (
                    <div
                      key={row.category ?? "other"}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                    >
                      <span className="text-sm">
                        {row.category
                          ? CATEGORY_LABELS[row.category] ?? row.category
                          : "Other"}
                      </span>
                      <span className="font-semibold text-sm">{formatUsd(row.amountUsd)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.recentGrants.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Recent grants</h2>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {data.recentGrants.map((grant) => (
                    <div key={grant.id} className="px-4 py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {grant.programTitle ?? grant.description ?? "Community grant"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(grant.createdAt).toLocaleDateString()}
                          {grant.category
                            ? ` · ${CATEGORY_LABELS[grant.category] ?? grant.category}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-sm font-semibold shrink-0">
                        {formatUsd(grant.amountUsd)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  )
}
