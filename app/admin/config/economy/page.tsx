"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { GiftCatalogIcon } from "@/components/gift-icon"
import { useAdminQuery } from "@/lib/admin/use-admin-query"
import {
  deleteAdminCoinPackage,
  deleteAdminGiftCatalog,
  fetchAdminEconomyConfig,
  initAdminGiftImageUpload,
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

type CoinDraft = Omit<AdminEconomyConfig["coinPackages"][number], "priceUsd">
type GiftDraft = AdminEconomyConfig["gifts"][number]

function packagePriceUsd(coins: number, coinUsd: number) {
  if (!Number.isFinite(coins) || coins <= 0) return 0
  const rate = Number.isFinite(coinUsd) && coinUsd > 0 ? coinUsd : 0.02
  return Math.round(coins * rate * 100) / 100
}

const EMPTY_COIN: CoinDraft = {
  id: "",
  label: "",
  coins: 100,
  isActive: true,
  sortOrder: 0,
}

const EMPTY_GIFT: GiftDraft = {
  id: "",
  name: "",
  coinCost: 10,
  animationKey: "",
  imageUrl: null,
  isActive: true,
}

export default function AdminConfigEconomyPage() {
  const { data, loading, error, reload } = useAdminQuery(fetchAdminEconomyConfig, [])
  const giftImageRef = useRef<HTMLInputElement>(null)
  const [pricing, setPricing] = useState({
    coinUsd: 0.02,
    minPaidStreamUsd: 5,
    minPayoutUsd: 50,
    membershipPriceUsd: 4.99,
  })
  const [coinEditor, setCoinEditor] = useState<CoinDraft | null>(null)
  const [giftEditor, setGiftEditor] = useState<GiftDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [giftUploadBusy, setGiftUploadBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const activeCoinUsd = data?.coinUsd ?? pricing.coinUsd
  const coinIsEdit = Boolean(coinEditor?.id && data?.coinPackages.some((p) => p.id === coinEditor.id))
  const giftIsEdit = Boolean(giftEditor?.id && data?.gifts.some((g) => g.id === giftEditor.id))

  const draftPriceUsd = useMemo(
    () => packagePriceUsd(coinEditor?.coins ?? 0, activeCoinUsd),
    [coinEditor?.coins, activeCoinUsd],
  )

  useEffect(() => {
    if (!data) return
    setPricing({
      coinUsd: data.coinUsd ?? 0.02,
      minPaidStreamUsd: data.minPaidStreamUsd ?? 5,
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
      setMessage("Pricing settings saved. Coin package prices were updated to match the new coin value.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const saveCoin = async () => {
    if (!coinEditor?.id.trim() || !coinEditor.label.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await upsertAdminCoinPackage({
        ...coinEditor,
        priceUsd: packagePriceUsd(coinEditor.coins, activeCoinUsd),
      })
      setCoinEditor(null)
      await reload()
      setMessage("Coin package saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const saveGift = async () => {
    if (!giftEditor?.id.trim() || !giftEditor.name.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await upsertAdminGiftCatalog({
        ...giftEditor,
        animationKey: giftEditor.animationKey?.trim() || giftEditor.id,
      })
      setGiftEditor(null)
      await reload()
      setMessage("Gift saved.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed")
    } finally {
      setBusy(false)
    }
  }

  const uploadGiftImage = async (file: File) => {
    if (!giftEditor?.id.trim()) {
      setMessage("Enter a gift ID before uploading an image.")
      return
    }
    setGiftUploadBusy(true)
    setMessage(null)
    try {
      const mimeType = file.type?.trim().startsWith("image/")
        ? file.type
        : "image/png"
      const init = await initAdminGiftImageUpload({
        giftId: giftEditor.id.trim(),
        fileName: file.name,
        mimeType,
      })
      const put = await fetch(init.uploadUrl, {
        method: init.uploadMethod || "PUT",
        body: file,
        headers: init.uploadHeaders?.["Content-Type"]
          ? init.uploadHeaders
          : { "Content-Type": mimeType },
      })
      if (!put.ok) throw new Error("Image upload failed")
      setGiftEditor((d) => (d ? { ...d, imageUrl: init.publicUrl } : d))
      setMessage("Gift image uploaded. Save the gift to apply.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Image upload failed")
    } finally {
      setGiftUploadBusy(false)
    }
  }

  const removeCoin = async (id: string) => {
    setBusy(true)
    try {
      await deleteAdminCoinPackage(id)
      if (coinEditor?.id === id) setCoinEditor(null)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const removeGift = async (id: string) => {
    setBusy(true)
    try {
      await deleteAdminGiftCatalog(id)
      if (giftEditor?.id === id) setGiftEditor(null)
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
          <Label>Coin value (USD)</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            How much one coin is worth when spent (gifts, paid live streams, revenue).
            At 0.02, $1 = 50 coins — half as many coins as the old 0.01 rate.
          </p>
          <Input
            type="number"
            className="mt-1"
            step={0.001}
            min={0.0001}
            value={pricing.coinUsd}
            onChange={(e) =>
              setPricing((p) => ({ ...p, coinUsd: Number(e.target.value) }))
            }
          />
          <p className="text-xs text-muted-foreground mt-1">
            {Number.isFinite(pricing.coinUsd) && pricing.coinUsd > 0
              ? `$1 ≈ ${Math.round(1 / pricing.coinUsd).toLocaleString()} coins`
              : null}
          </p>
        </div>
        <div>
          <Label>Min paid live stream (USD)</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1">
            Lowest price a streamer can set for a VIP / paid live stream.
          </p>
          <Input
            type="number"
            className="mt-1"
            step={0.01}
            min={0.01}
            value={pricing.minPaidStreamUsd}
            onChange={(e) =>
              setPricing((p) => ({ ...p, minPaidStreamUsd: Number(e.target.value) }))
            }
          />
        </div>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Package prices are calculated automatically:{" "}
              <strong>coins × coin value</strong> (${activeCoinUsd.toFixed(2)} per coin).
            </p>
            {!coinEditor && (
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => setCoinEditor({ ...EMPTY_COIN })}
              >
                Add coin package
              </Button>
            )}
          </div>
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
                    <TableCell>{p.coins.toLocaleString()}</TableCell>
                    <TableCell>
                      ${packagePriceUsd(p.coins, activeCoinUsd).toFixed(2)}
                    </TableCell>
                    <TableCell>{p.sortOrder}</TableCell>
                    <TableCell>{p.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          setCoinEditor({
                            id: p.id,
                            label: p.label,
                            coins: p.coins,
                            isActive: p.isActive,
                            sortOrder: p.sortOrder,
                          })
                        }
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

          {coinEditor && (
            <div className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {coinIsEdit ? "Edit coin package" : "New coin package"}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setCoinEditor(null)}
                >
                  Cancel
                </Button>
              </div>
              <div>
                <Label className="text-xs">ID</Label>
                <Input
                  className="mt-1 h-8"
                  value={coinEditor.id}
                  disabled={coinIsEdit}
                  onChange={(e) => setCoinEditor((d) => d && { ...d, id: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Label</Label>
                <Input
                  className="mt-1 h-8"
                  value={coinEditor.label}
                  onChange={(e) => setCoinEditor((d) => d && { ...d, label: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Coins</Label>
                <Input
                  type="number"
                  className="mt-1 h-8"
                  value={coinEditor.coins}
                  onChange={(e) =>
                    setCoinEditor((d) => d && { ...d, coins: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Price USD (auto)</Label>
                <div className="mt-1 h-8 flex items-center px-3 rounded-md border border-border bg-muted/40 text-sm font-medium">
                  ${draftPriceUsd.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {coinEditor.coins.toLocaleString()} × ${activeCoinUsd.toFixed(2)}
                </p>
              </div>
              <div>
                <Label className="text-xs">Sort order</Label>
                <Input
                  type="number"
                  className="mt-1 h-8"
                  value={coinEditor.sortOrder}
                  onChange={(e) =>
                    setCoinEditor((d) => d && { ...d, sortOrder: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-end gap-2">
                <Switch
                  checked={coinEditor.isActive}
                  onCheckedChange={(v) => setCoinEditor((d) => d && { ...d, isActive: v })}
                />
                <Label className="text-xs">Active</Label>
              </div>
              <div className="sm:col-span-3">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={busy}
                  onClick={() => void saveCoin()}
                >
                  Save coin package
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gifts" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Upload a custom image per gift, or use a built-in emoji key (
              <span className="font-mono">heart</span>, <span className="font-mono">star</span>,{" "}
              <span className="font-mono">fire</span>, etc.). Custom images take priority in chat
              and the gift picker.
            </p>
            {!giftEditor && (
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => setGiftEditor({ ...EMPTY_GIFT })}
              >
                Add gift
              </Button>
            )}
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Coin cost</TableHead>
                  <TableHead>USD value</TableHead>
                  <TableHead>Animation</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.gifts.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      <GiftCatalogIcon gift={g} size={28} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{g.id}</TableCell>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.coinCost}</TableCell>
                    <TableCell>${packagePriceUsd(g.coinCost, activeCoinUsd).toFixed(2)}</TableCell>
                    <TableCell>{g.animationKey}</TableCell>
                    <TableCell>{g.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setGiftEditor({ ...g })}
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

          {giftEditor && (
            <div className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{giftIsEdit ? "Edit gift" : "New gift"}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setGiftEditor(null)}
                >
                  Cancel
                </Button>
              </div>
              <div>
                <Label className="text-xs">ID</Label>
                <Input
                  className="mt-1 h-8"
                  value={giftEditor.id}
                  disabled={giftIsEdit}
                  onChange={(e) => setGiftEditor((d) => d && { ...d, id: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  className="mt-1 h-8"
                  value={giftEditor.name}
                  onChange={(e) => setGiftEditor((d) => d && { ...d, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Coin cost</Label>
                <Input
                  type="number"
                  className="mt-1 h-8"
                  value={giftEditor.coinCost}
                  onChange={(e) =>
                    setGiftEditor((d) => d && { ...d, coinCost: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Animation key (optional)</Label>
                <Input
                  className="mt-1 h-8"
                  placeholder="heart, star, fire…"
                  value={giftEditor.animationKey}
                  onChange={(e) =>
                    setGiftEditor((d) => d && { ...d, animationKey: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fallback emoji when no custom image is set.
                </p>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Gift image</Label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <GiftCatalogIcon gift={giftEditor} size={48} />
                  <input
                    ref={giftImageRef}
                    type="file"
                    accept="image/png,image/webp,image/gif,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadGiftImage(file)
                      e.target.value = ""
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={giftUploadBusy || !giftEditor.id.trim()}
                    onClick={() => giftImageRef.current?.click()}
                  >
                    {giftUploadBusy ? "Uploading…" : "Upload image"}
                  </Button>
                  {giftEditor.imageUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-destructive"
                      onClick={() => setGiftEditor((d) => d && { ...d, imageUrl: null })}
                    >
                      Remove image
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Optimal: <strong>128×128</strong> or <strong>256×256</strong> px, square, PNG or
                  WebP with transparency (GIF for simple animation). Keep under <strong>200 KB</strong>.
                  JPEG works but no transparency.
                </p>
              </div>
              <div className="flex items-end gap-2">
                <Switch
                  checked={giftEditor.isActive}
                  onCheckedChange={(v) => setGiftEditor((d) => d && { ...d, isActive: v })}
                />
                <Label className="text-xs">Active</Label>
              </div>
              <div className="sm:col-span-3">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={busy}
                  onClick={() => void saveGift()}
                >
                  Save gift
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
