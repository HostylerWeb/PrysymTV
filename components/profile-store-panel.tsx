"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Download, Loader2, Package, Plus, Settings2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  createMyStoreProduct,
  deleteMyStoreProduct,
  fetchMyStore,
  updateMyStore,
  type StoreProduct,
} from "@/lib/api/stores"

const PRODUCT_TYPES = [
  { id: "merchandise" as const, label: "Physical", icon: Package },
  { id: "digital" as const, label: "Digital", icon: Download },
]

const fieldClass =
  "w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

function parseGalleryUrls(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 10)
}

export function ProfileStorePanel() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [storeName, setStoreName] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    displayName: "",
    description: "",
    shippingFree: true,
    shippingFeeUsd: "",
  })
  const [form, setForm] = useState({
    productType: "merchandise" as "merchandise" | "digital",
    title: "",
    description: "",
    priceUsd: "",
    imageUrl: "",
    galleryUrls: "",
    digitalUrl: "",
    inventory: "1",
    inventoryUnlimited: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMyStore()
      setStoreName(data.store.displayName)
      setProducts(data.products)
      setSettings({
        displayName: data.store.displayName,
        description: data.store.description ?? "",
        shippingFree: data.store.shippingFree,
        shippingFeeUsd:
          data.store.shippingFree ? "" : String(data.store.shippingFeeUsd ?? ""),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load store")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const resetForm = () => {
    setForm({
      productType: "merchandise",
      title: "",
      description: "",
      priceUsd: "",
      imageUrl: "",
      galleryUrls: "",
      digitalUrl: "",
      inventory: "1",
      inventoryUnlimited: false,
    })
    setShowForm(false)
  }

  const submitProduct = async () => {
    const title = form.title.trim()
    const imageUrl = form.imageUrl.trim()
    const price = parseFloat(form.priceUsd)
    if (!title || !imageUrl || !Number.isFinite(price) || price < 0.01) {
      setError("Title, cover image URL, and a valid price are required")
      return
    }
    if (form.productType === "digital" && !form.digitalUrl.trim()) {
      setError("Download URL is required for digital products")
      return
    }
    if (
      form.productType === "merchandise" &&
      !form.inventoryUnlimited &&
      (parseInt(form.inventory, 10) < 1 || !Number.isFinite(parseInt(form.inventory, 10)))
    ) {
      setError("Stock must be at least 1, or enable unlimited stock")
      return
    }

    setBusy(true)
    setError(null)
    try {
      const galleryUrls = parseGalleryUrls(form.galleryUrls)
      const created = await createMyStoreProduct({
        productType: form.productType,
        title,
        description: form.description.trim() || undefined,
        priceUsd: price,
        imageUrl,
        galleryUrls: galleryUrls.length > 0 ? galleryUrls : undefined,
        digitalUrl:
          form.productType === "digital" ? form.digitalUrl.trim() : undefined,
        inventory:
          form.productType === "merchandise" && !form.inventoryUnlimited
            ? parseInt(form.inventory, 10)
            : undefined,
        inventoryUnlimited:
          form.productType === "merchandise" ? form.inventoryUnlimited : undefined,
      })
      setProducts((prev) => [created, ...prev])
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add product")
    } finally {
      setBusy(false)
    }
  }

  const saveSettings = async () => {
    const displayName = settings.displayName.trim()
    if (!displayName) {
      setError("Store name is required")
      return
    }
    if (!settings.shippingFree) {
      const fee = parseFloat(settings.shippingFeeUsd)
      if (!Number.isFinite(fee) || fee < 0) {
        setError("Enter a valid shipping fee or enable free shipping")
        return
      }
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await updateMyStore({
        displayName,
        description: settings.description.trim() || undefined,
        shippingFree: settings.shippingFree,
        shippingFeeUsd: settings.shippingFree
          ? 0
          : parseFloat(settings.shippingFeeUsd),
      })
      setStoreName(updated.displayName)
      setShowSettings(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save store settings")
    } finally {
      setBusy(false)
    }
  }

  const removeProduct = async (id: string) => {
    setBusy(true)
    try {
      await deleteMyStoreProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card/40 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{storeName || "Your store"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              List physical merch and digital downloads. Buyers checkout via Stripe on the product page.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={() => setShowSettings((v) => !v)}
            >
              <Settings2 className="w-4 h-4" />
              Store settings
            </Button>
            <Button
              size="sm"
              variant={showForm ? "outline" : "default"}
              className="rounded-full gap-1.5"
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
            >
              {showForm ? (
                "Cancel"
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add product
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {showSettings && (
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 md:p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Store settings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shop name, description, and shipping rules for physical products.
            </p>
          </div>

          <div>
            <label htmlFor="store-settings-name" className={labelClass}>
              Store name <span className="text-destructive">*</span>
            </label>
            <input
              id="store-settings-name"
              className={fieldClass}
              value={settings.displayName}
              onChange={(e) => setSettings((s) => ({ ...s, displayName: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="store-settings-desc" className={labelClass}>
              Description <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="store-settings-desc"
              value={settings.description}
              onChange={(e) => setSettings((s) => ({ ...s, description: e.target.value }))}
              className="w-full h-24 px-4 py-3 rounded-xl bg-secondary text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"
            />
          </div>

          <div className="space-y-3">
            <p className={labelClass}>Shipping for physical items</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="shipping-mode"
                checked={settings.shippingFree}
                onChange={() => setSettings((s) => ({ ...s, shippingFree: true }))}
              />
              <span className="text-sm font-medium">Free shipping</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="shipping-mode"
                checked={!settings.shippingFree}
                onChange={() => setSettings((s) => ({ ...s, shippingFree: false }))}
              />
              <span className="text-sm font-medium">Flat-rate shipping fee</span>
            </label>
            {!settings.shippingFree && (
              <div>
                <label htmlFor="store-shipping-fee" className={labelClass}>
                  Shipping fee (USD) <span className="text-destructive">*</span>
                </label>
                <input
                  id="store-shipping-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  className={cn(fieldClass, "sm:max-w-[10rem]")}
                  value={settings.shippingFeeUsd}
                  onChange={(e) => setSettings((s) => ({ ...s, shippingFeeUsd: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" className="rounded-full sm:flex-1" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button className="rounded-full sm:flex-1" disabled={busy} onClick={() => void saveSettings()}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save settings"}
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 md:p-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">New product</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Physical items need stock (min 1) or unlimited. Digital items deliver a download link after purchase.
            </p>
          </div>

          <div>
            <p className={labelClass}>Product type</p>
            <div className="flex p-1 rounded-full bg-secondary/40 border border-border/60">
              {PRODUCT_TYPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, productType: id }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-all",
                    form.productType === id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="store-title" className={labelClass}>
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="store-title"
                className={fieldClass}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Product name"
                required
              />
            </div>
            <div>
              <label htmlFor="store-price" className={labelClass}>
                Price (USD) <span className="text-destructive">*</span>
              </label>
              <input
                id="store-price"
                type="number"
                min="0.01"
                step="0.01"
                className={fieldClass}
                value={form.priceUsd}
                onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="store-image" className={labelClass}>
              Cover image URL <span className="text-destructive">*</span>
            </label>
            <input
              id="store-image"
              type="url"
              className={fieldClass}
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              required
            />
          </div>

          <div>
            <label htmlFor="store-gallery" className={labelClass}>
              Gallery image URLs <span className="font-normal">(optional, one per line, max 10)</span>
            </label>
            <textarea
              id="store-gallery"
              value={form.galleryUrls}
              onChange={(e) => setForm((f) => ({ ...f, galleryUrls: e.target.value }))}
              placeholder={"https://example.com/photo-1.jpg\nhttps://example.com/photo-2.jpg"}
              className="w-full h-24 px-4 py-3 rounded-xl bg-secondary text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"
            />
          </div>

          {form.productType === "digital" ? (
            <div>
              <label htmlFor="store-digital" className={labelClass}>
                Download URL <span className="text-destructive">*</span>
              </label>
              <input
                id="store-digital"
                type="url"
                className={fieldClass}
                placeholder="https://..."
                value={form.digitalUrl}
                onChange={(e) => setForm((f) => ({ ...f, digitalUrl: e.target.value }))}
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inventoryUnlimited}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inventoryUnlimited: e.target.checked }))
                  }
                  className="rounded border-border"
                />
                <span className="text-sm font-medium">Unlimited stock</span>
              </label>
              {!form.inventoryUnlimited && (
                <div>
                  <label htmlFor="store-inventory" className={labelClass}>
                    Stock quantity <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="store-inventory"
                    type="number"
                    min="1"
                    className={cn(fieldClass, "sm:max-w-[10rem]")}
                    value={form.inventory}
                    onChange={(e) => setForm((f) => ({ ...f, inventory: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 1 — zero stock is not allowed.</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="store-description" className={labelClass}>
              Description <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="store-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Tell buyers what they are getting…"
              className="w-full h-24 px-4 py-3 rounded-xl bg-secondary text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button variant="outline" className="rounded-full sm:flex-1" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              className="rounded-full sm:flex-1"
              disabled={busy}
              onClick={() => void submitProduct()}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish product"}
            </Button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products yet. Add your first item above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <article
              key={p.id}
              className="rounded-xl border border-border/80 overflow-hidden bg-card/40"
            >
              {p.imageUrl ? (
                <div className="aspect-[4/3] bg-muted">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {p.productType === "merchandise" ? "Physical" : "Digital"} · ${p.priceUsd.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-8 w-8 text-destructive"
                    disabled={busy}
                    onClick={() => void removeProduct(p.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {p.productType === "merchandise" && (
                  <p className="text-xs text-muted-foreground">
                    {p.inventoryUnlimited ? "Unlimited stock" : `Stock: ${p.inventory}`}
                  </p>
                )}
                {p.galleryUrls?.length > 0 && (
                  <p className="text-xs text-muted-foreground">{p.galleryUrls.length} gallery image(s)</p>
                )}
                <span className="inline-flex text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-600">
                  {p.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Only list legal products and services. See our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/guidelines" className="text-primary hover:underline">
          Community Guidelines
        </Link>
        .
      </p>
    </div>
  )
}
