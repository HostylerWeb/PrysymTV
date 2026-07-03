"use client"

import { Download, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const PRODUCT_TYPES = [
  { id: "merchandise" as const, label: "Physical", icon: Package },
  { id: "digital" as const, label: "Digital", icon: Download },
]

export type StoreProductFormValues = {
  productType: "merchandise" | "digital"
  title: string
  description: string
  priceUsd: string
  imageUrl: string
  galleryUrls: string
  digitalUrl: string
  inventory: string
  inventoryUnlimited: boolean
  status: "active" | "draft" | "archived"
}

export const EMPTY_PRODUCT_FORM: StoreProductFormValues = {
  productType: "merchandise",
  title: "",
  description: "",
  priceUsd: "",
  imageUrl: "",
  galleryUrls: "",
  digitalUrl: "",
  inventory: "1",
  inventoryUnlimited: false,
  status: "active",
}

const fieldClass =
  "w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

export function productToFormValues(product: {
  productType: "merchandise" | "digital" | string
  title: string
  description: string | null
  priceUsd: number
  imageUrl: string | null
  galleryUrls?: string[]
  digitalUrl?: string | null
  inventory: number | null
  inventoryUnlimited: boolean
  status?: string
}): StoreProductFormValues {
  return {
    productType: product.productType === "digital" ? "digital" : "merchandise",
    title: product.title,
    description: product.description ?? "",
    priceUsd: String(product.priceUsd),
    imageUrl: product.imageUrl ?? "",
    galleryUrls: (product.galleryUrls ?? []).join("\n"),
    digitalUrl: product.digitalUrl ?? "",
    inventory: product.inventory != null ? String(product.inventory) : "1",
    inventoryUnlimited: product.inventoryUnlimited,
    status: (product.status as StoreProductFormValues["status"]) ?? "active",
  }
}

type StoreProductFormProps = {
  mode: "create" | "edit"
  values: StoreProductFormValues
  onChange: (next: StoreProductFormValues) => void
  onSubmit: () => void
  onCancel: () => void
  busy?: boolean
  submitLabel?: string
}

export function StoreProductForm({
  mode,
  values,
  onChange,
  onSubmit,
  onCancel,
  busy,
  submitLabel,
}: StoreProductFormProps) {
  const set = (patch: Partial<StoreProductFormValues>) =>
    onChange({ ...values, ...patch })

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          {mode === "create" ? "New product" : "Edit product"}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {mode === "create"
            ? "Physical items need stock (min 1) or unlimited. Digital items deliver a download link after purchase."
            : "Update listing details, images, stock, or visibility."}
        </p>
      </div>

      {mode === "create" && (
        <div>
          <p className={labelClass}>Product type</p>
          <div className="flex p-1 rounded-full bg-secondary/40 border border-border/60">
            {PRODUCT_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => set({ productType: id })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-all",
                  values.productType === id
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
      )}

      {mode === "edit" && (
        <div>
          <label htmlFor="store-status" className={labelClass}>
            Listing status
          </label>
          <select
            id="store-status"
            className={fieldClass}
            value={values.status}
            onChange={(e) =>
              set({ status: e.target.value as StoreProductFormValues["status"] })
            }
          >
            <option value="active">Active — visible in store</option>
            <option value="draft">Draft — hidden from buyers</option>
            <option value="archived">Archived — hidden from buyers</option>
          </select>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="store-title" className={labelClass}>
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="store-title"
            className={fieldClass}
            value={values.title}
            onChange={(e) => set({ title: e.target.value })}
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
            value={values.priceUsd}
            onChange={(e) => set({ priceUsd: e.target.value })}
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
          value={values.imageUrl}
          onChange={(e) => set({ imageUrl: e.target.value })}
          required
        />
        {values.imageUrl.trim() && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border/60 bg-muted aspect-[4/3] max-w-[200px]">
            <img src={values.imageUrl.trim()} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="store-gallery" className={labelClass}>
          Gallery image URLs <span className="font-normal">(optional, one per line, max 10)</span>
        </label>
        <textarea
          id="store-gallery"
          value={values.galleryUrls}
          onChange={(e) => set({ galleryUrls: e.target.value })}
          placeholder={"https://example.com/photo-1.jpg\nhttps://example.com/photo-2.jpg"}
          className="w-full h-24 px-4 py-3 rounded-xl bg-secondary text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"
        />
      </div>

      {values.productType === "digital" ? (
        <div>
          <label htmlFor="store-digital" className={labelClass}>
            Download URL <span className="text-destructive">*</span>
          </label>
          <input
            id="store-digital"
            type="url"
            className={fieldClass}
            placeholder="https://..."
            value={values.digitalUrl}
            onChange={(e) => set({ digitalUrl: e.target.value })}
            required
          />
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.inventoryUnlimited}
              onChange={(e) => set({ inventoryUnlimited: e.target.checked })}
              className="rounded border-border"
            />
            <span className="text-sm font-medium">Unlimited stock</span>
          </label>
          {!values.inventoryUnlimited && (
            <div>
              <label htmlFor="store-inventory" className={labelClass}>
                Stock quantity <span className="text-destructive">*</span>
              </label>
              <input
                id="store-inventory"
                type="number"
                min="1"
                className={cn(fieldClass, "sm:max-w-[10rem]")}
                value={values.inventory}
                onChange={(e) => set({ inventory: e.target.value })}
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
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Tell buyers what they are getting…"
          className="w-full h-28 px-4 py-3 rounded-xl bg-secondary text-sm resize-none outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
        <Button variant="outline" className="rounded-full sm:flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="rounded-full sm:flex-1"
          disabled={busy}
          onClick={() => void onSubmit()}
        >
          {busy ? "Saving…" : submitLabel ?? (mode === "create" ? "Publish product" : "Save changes")}
        </Button>
      </div>
    </div>
  )
}

export function parseGalleryUrls(raw: string): string[] {
  return raw
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 10)
}

export function validateProductForm(values: StoreProductFormValues): string | null {
  const title = values.title.trim()
  const imageUrl = values.imageUrl.trim()
  const price = parseFloat(values.priceUsd)
  if (!title || !imageUrl || !Number.isFinite(price) || price < 0.01) {
    return "Title, cover image URL, and a valid price are required"
  }
  if (values.productType === "digital" && !values.digitalUrl.trim()) {
    return "Download URL is required for digital products"
  }
  if (
    values.productType === "merchandise" &&
    !values.inventoryUnlimited &&
    (parseInt(values.inventory, 10) < 1 || !Number.isFinite(parseInt(values.inventory, 10)))
  ) {
    return "Stock must be at least 1, or enable unlimited stock"
  }
  return null
}

export function productFormToApiBody(values: StoreProductFormValues, mode: "create" | "edit") {
  const galleryUrls = parseGalleryUrls(values.galleryUrls)
  const base = {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    priceUsd: parseFloat(values.priceUsd),
    imageUrl: values.imageUrl.trim(),
    galleryUrls: galleryUrls.length > 0 ? galleryUrls : mode === "edit" ? [] : undefined,
    digitalUrl:
      values.productType === "digital" ? values.digitalUrl.trim() : mode === "edit" ? null : undefined,
    inventory:
      values.productType === "merchandise" && !values.inventoryUnlimited
        ? parseInt(values.inventory, 10)
        : mode === "edit" && values.productType === "merchandise" && values.inventoryUnlimited
          ? null
          : undefined,
    inventoryUnlimited:
      values.productType === "merchandise" ? values.inventoryUnlimited : undefined,
  }
  if (mode === "create") {
    return {
      productType: values.productType,
      ...base,
      galleryUrls: galleryUrls.length > 0 ? galleryUrls : undefined,
      digitalUrl: values.productType === "digital" ? values.digitalUrl.trim() : undefined,
    }
  }
  return {
    ...base,
    status: values.status,
  }
}
