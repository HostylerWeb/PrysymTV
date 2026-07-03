"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ExternalLink,
  Loader2,
  Package,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  StoreProductForm,
  EMPTY_PRODUCT_FORM,
  productFormToApiBody,
  productToFormValues,
  validateProductForm,
  type StoreProductFormValues,
} from "@/components/store-product-form"
import {
  createMyStoreProduct,
  deleteMyStoreProduct,
  fetchMyStore,
  updateMyStore,
  updateMyStoreProduct,
  type StoreProduct,
} from "@/lib/api/stores"
import { useAuth } from "@/contexts/auth-context"

const fieldClass =
  "w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

function statusBadgeClass(status: string) {
  if (status === "active") return "bg-green-500/15 text-green-600"
  if (status === "draft") return "bg-amber-500/15 text-amber-600"
  return "bg-muted text-muted-foreground"
}

export function ProfileStorePanel() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [storeName, setStoreName] = useState("")
  const [formMode, setFormMode] = useState<"hidden" | "create" | "edit">("hidden")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [form, setForm] = useState<StoreProductFormValues>(EMPTY_PRODUCT_FORM)
  const [settings, setSettings] = useState({
    displayName: "",
    description: "",
    shippingFree: true,
    shippingFeeUsd: "",
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

  const closeForm = () => {
    setFormMode("hidden")
    setEditingId(null)
    setForm(EMPTY_PRODUCT_FORM)
  }

  const openCreate = () => {
    setForm(EMPTY_PRODUCT_FORM)
    setEditingId(null)
    setFormMode("create")
    setShowSettings(false)
  }

  const openEdit = (product: StoreProduct) => {
    setForm(productToFormValues(product))
    setEditingId(product.id)
    setFormMode("edit")
    setShowSettings(false)
  }

  useEffect(() => {
    const editId = searchParams.get("edit")
    if (!editId || products.length === 0) return
    const product = products.find((p) => p.id === editId)
    if (product) openEdit(product)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once when products load
  }, [searchParams, products])

  const submitProduct = async () => {
    const validationError = validateProductForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setBusy(true)
    setError(null)
    try {
      if (formMode === "create") {
        const body = productFormToApiBody(form, "create") as Parameters<
          typeof createMyStoreProduct
        >[0]
        const created = await createMyStoreProduct(body)
        setProducts((prev) => [created, ...prev])
      } else if (editingId) {
        const body = productFormToApiBody(form, "edit")
        const updated = await updateMyStoreProduct(editingId, body)
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      }
      closeForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save product")
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
        shippingFeeUsd: settings.shippingFree ? 0 : parseFloat(settings.shippingFeeUsd),
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
    if (!confirm("Delete this product? This cannot be undone.")) return
    setBusy(true)
    try {
      await deleteMyStoreProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      if (editingId === id) closeForm()
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

  const publicStoreUrl = user?.username
    ? `/creator/${user.username}?tab=store`
    : null

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card/80 to-card/40 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{storeName || "Your store"}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Manage products, shipping, and pricing. Buyers checkout on your public product pages.
            </p>
            {publicStoreUrl && (
              <Link
                href={publicStoreUrl}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium mt-2 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View public store
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full gap-1.5"
              onClick={() => {
                setShowSettings((v) => !v)
                if (!showSettings) closeForm()
              }}
            >
              <Settings2 className="w-4 h-4" />
              Store settings
            </Button>
            <Button
              size="sm"
              variant={formMode === "create" ? "outline" : "default"}
              className="rounded-full gap-1.5"
              onClick={() => (formMode === "create" ? closeForm() : openCreate())}
            >
              {formMode === "create" ? (
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
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {showSettings && (
        <div className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-6 space-y-5">
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

      {formMode !== "hidden" && (
        <div className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-6">
          <StoreProductForm
            mode={formMode}
            values={form}
            onChange={setForm}
            busy={busy}
            onSubmit={() => void submitProduct()}
            onCancel={closeForm}
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border/80 bg-card/20">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products yet. Add your first item above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <article
              key={p.id}
              className="group rounded-2xl border border-border/80 overflow-hidden bg-card/40 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <Link
                href={user?.username ? `/creator/${user.username}/store/${p.id}` : "#"}
                className="block"
              >
                {p.imageUrl ? (
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </Link>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={user?.username ? `/creator/${user.username}/store/${p.id}` : "#"}
                      className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.productType === "merchandise" ? "Physical" : "Digital"} · ${p.priceUsd.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={busy}
                      title="Edit product"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      disabled={busy}
                      title="Delete product"
                      onClick={() => void removeProduct(p.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {p.productType === "merchandise" && (
                  <p className="text-xs text-muted-foreground">
                    {p.inventoryUnlimited ? "Unlimited stock" : `Stock: ${p.inventory}`}
                  </p>
                )}
                {p.galleryUrls?.length > 0 && (
                  <p className="text-xs text-muted-foreground">{p.galleryUrls.length} gallery image(s)</p>
                )}
                <span
                  className={cn(
                    "inline-flex text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full",
                    statusBadgeClass(p.status),
                  )}
                >
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
