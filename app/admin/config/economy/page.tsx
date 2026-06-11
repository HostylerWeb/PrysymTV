"use client"

import { useEffect, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  deleteAdminCoinPackage,
  deleteAdminGiftCatalog,
  fetchAdminEconomyConfig,
  updateAdminEconomyConfig,
  upsertAdminCoinPackage,
  upsertAdminGiftCatalog,
  type AdminEconomyConfig,
} from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type CoinDraft = AdminEconomyConfig["coinPackages"][number]
type GiftDraft = AdminEconomyConfig["gifts"][number]

const EMPTY_COIN: CoinDraft = {
  id: "",
  label: "",
  coins: 100,
  priceUsd: 0.99,
  isActive: true,
  sortOrder: 0,
}

const EMPTY_GIFT: GiftDraft = {
  id: "",
  name: "",
  coinCost: 10,
  animationKey: "",
  isActive: true,
}

export default function AdminConfigEconomyPage() {
  const { data, loading, error, reload } = useAdminQuery(fetchAdminEconomyConfig, [])
  const [pricing, setPricing] = useState({
    minPayoutUsd: 50,
    membershipPriceUsd: 4.99,
  })
  const [coinDraft, setCoinDraft] = useState<CoinDraft>(EMPTY_COIN)
  const [giftDraft, setGiftDraft] = useState<GiftDraft>(EMPTY_GIFT)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setPricing({
      minPayoutUsd: data.minPayoutUsd,
      membershipPriceUsd: data.membershipPriceUsd ?? data.premiumPriceUsd,
    })
  }, [data])

  const savePricing = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await updateAdminEconomyConfig(pricing)
      await reload()
      setMessage("Pricing settings saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const saveCoin = async () => {
    if (!coinDraft.id.trim() || !coinDraft.label.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await upsertAdminCoinPackage(coinDraft)
      setCoinDraft(EMPTY_COIN)
      await reload()
      setMessage("Coin package saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const saveGift = async () => {
    if (!giftDraft.id.trim() || !giftDraft.name.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await upsertAdminGiftCatalog(giftDraft)
      setGiftDraft(EMPTY_GIFT)
      await reload()
      setMessage("Gift saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const removeCoin = async (id: string) => {
    setBusy(true)
    try {
      await deleteAdminCoinPackage(id)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const removeGift = async (id: string) => {
    setBusy(true)
    try {
      await deleteAdminGiftCatalog(id)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Loading economy config…</p>
  }

  if (error || !data) {
    return <p className="text-sm text-destructive py-12 text-center">{error ?? "Failed to load"}</p>
  }

  return (
    <>
      <AdminPageHeader
        title="Configuration — Economy"
        description="Pricing knobs, coin packages, and gift catalog."
      />

      {message && <p className="text-sm text-muted-foreground mb-4">{message}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Min payout (USD)</Label>
          <Input
            type="number"
            className="mt-1"
            value={pricing.minPayoutUsd}
            onChange={(e) =>
              setPricing((p) => ({ ...p, minPayoutUsd: Number(e.target.value) }))
            }
          />
        </div>
        <div>
          <Label>Membership price (USD/mo)</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            Ad-free on Shorts, Verticals, and Movies. Shown in Settings → Premium.
          </p>
          <Input
            type="number"
            className="mt-1"
            step={0.01}
            value={pricing.membershipPriceUsd}
            onChange={(e) =>
              setPricing((p) => ({ ...p, membershipPriceUsd: Number(e.target.value) }))
            }
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Membership revenue splits (platform / GAF / creator dev fund) are configured under{" "}
          <a href="/admin/config/revenue" className="text-primary underline">
            Configuration → Revenue
          </a>{" "}
          → <span className="font-mono">insider_membership</span>.
        </p>
      </div>
      <Button className="rounded-full mb-8" disabled={busy} onClick={() => void savePricing()}>
        Save pricing settings
      </Button>

      <Tabs defaultValue="coins">
        <TabsList>
          <TabsTrigger value="coins">Coin packages</TabsTrigger>
          <TabsTrigger value="gifts">Gift catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="coins" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.coinPackages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell>{p.label}</TableCell>
                    <TableCell>{p.coins}</TableCell>
                    <TableCell>${p.priceUsd}</TableCell>
                    <TableCell>{p.sortOrder}</TableCell>
                    <TableCell>{p.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setCoinDraft(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-destructive"
                        disabled={busy}
                        onClick={() => void removeCoin(p.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">ID</Label>
              <Input
                className="mt-1 h-8"
                value={coinDraft.id}
                onChange={(e) => setCoinDraft((d) => ({ ...d, id: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Label</Label>
              <Input
                className="mt-1 h-8"
                value={coinDraft.label}
                onChange={(e) => setCoinDraft((d) => ({ ...d, label: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Coins</Label>
              <Input
                type="number"
                className="mt-1 h-8"
                value={coinDraft.coins}
                onChange={(e) => setCoinDraft((d) => ({ ...d, coins: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs">Price USD</Label>
              <Input
                type="number"
                step={0.01}
                className="mt-1 h-8"
                value={coinDraft.priceUsd}
                onChange={(e) => setCoinDraft((d) => ({ ...d, priceUsd: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs">Sort order</Label>
              <Input
                type="number"
                className="mt-1 h-8"
                value={coinDraft.sortOrder}
                onChange={(e) =>
                  setCoinDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch
                checked={coinDraft.isActive}
                onCheckedChange={(v) => setCoinDraft((d) => ({ ...d, isActive: v }))}
              />
              <Label className="text-xs">Active</Label>
            </div>
            <div className="sm:col-span-3">
              <Button size="sm" className="rounded-full" disabled={busy} onClick={() => void saveCoin()}>
                Save coin package
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gifts" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Coin cost</TableHead>
                  <TableHead>Animation</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.gifts.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{g.id}</TableCell>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.coinCost}</TableCell>
                    <TableCell>{g.animationKey}</TableCell>
                    <TableCell>{g.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setGiftDraft(g)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-destructive"
                        disabled={busy}
                        onClick={() => void removeGift(g.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">ID</Label>
              <Input
                className="mt-1 h-8"
                value={giftDraft.id}
                onChange={(e) => setGiftDraft((d) => ({ ...d, id: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                className="mt-1 h-8"
                value={giftDraft.name}
                onChange={(e) => setGiftDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Coin cost</Label>
              <Input
                type="number"
                className="mt-1 h-8"
                value={giftDraft.coinCost}
                onChange={(e) => setGiftDraft((d) => ({ ...d, coinCost: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs">Animation key</Label>
              <Input
                className="mt-1 h-8"
                value={giftDraft.animationKey}
                onChange={(e) => setGiftDraft((d) => ({ ...d, animationKey: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch
                checked={giftDraft.isActive}
                onCheckedChange={(v) => setGiftDraft((d) => ({ ...d, isActive: v }))}
              />
              <Label className="text-xs">Active</Label>
            </div>
            <div className="sm:col-span-3">
              <Button size="sm" className="rounded-full" disabled={busy} onClick={() => void saveGift()}>
                Save gift
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
