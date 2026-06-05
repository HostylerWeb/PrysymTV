"use client"

import Link from "next/link"
import { Coins, Gift, TrendingUp } from "lucide-react"
import { AdminKpiCard } from "@/components/admin/admin-kpi-card"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import { fetchAdminEconomyConfig, fetchAdminGiftActivity, fetchAdminTransactions } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"

export default function AdminEconomyOverviewPage() {
  const { data: config } = useAdminQuery(fetchAdminEconomyConfig, [])
  const { data: txns } = useAdminQuery(() => fetchAdminTransactions({ limit: 5 }), [])
  const { data: gifts } = useAdminQuery(() => fetchAdminGiftActivity({ limit: 5 }), [])

  const coinPackages = config?.coinPackages ?? []
  const giftItems = gifts?.items ?? []
  const giftVolume = giftItems.reduce((s, g) => s + g.coinCost, 0)

  return (
    <>
      <AdminPageHeader
        title="Economy"
        description="Coins, gifts, and platform-wide transaction activity."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Economy" }]}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/admin/config/economy">Edit packages & gifts</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminKpiCard
          label="Coin packages"
          value={coinPackages.length}
          sub={`${coinPackages.filter((p) => p.isActive).length} active`}
          icon={Coins}
          href="/admin/config/economy"
        />
        <AdminKpiCard
          label="Gift catalog"
          value={config?.gifts.length ?? 0}
          icon={Gift}
          href="/admin/config/economy"
        />
        <AdminKpiCard
          label="Recent gifts"
          value={giftItems.length}
          sub={`${giftVolume} coins (sample)`}
          icon={Gift}
          href="/admin/economy/gifts"
        />
        <AdminKpiCard
          label="Transactions"
          value={txns?.meta.total ?? 0}
          icon={TrendingUp}
          href="/admin/economy/transactions"
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">Recent transactions</h2>
        <ul className="space-y-2">
          {(txns?.items ?? []).map((t) => (
            <li key={t.id} className="flex justify-between text-sm py-2 border-b border-border last:border-0">
              <span>
                <span className="capitalize font-medium">{t.type.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground"> · {t.user}</span>
              </span>
              <span className="text-muted-foreground tabular-nums">
                {t.coins ? `${t.coins} coins` : `$${t.amountUsd}`}
              </span>
            </li>
          ))}
          {(txns?.items.length ?? 0) === 0 && (
            <li className="text-sm text-muted-foreground py-2">No transactions yet.</li>
          )}
        </ul>
      </section>
    </>
  )
}
