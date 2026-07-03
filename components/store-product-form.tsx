"use client"

import { useRef, useState } from "react"
import { Download, Loader2, Package, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { uploadStoreProductImage } from "@/lib/api/stores"

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
  galleryUrls: string[]
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
  galleryUrls: [],
  digitalUrl: "",
  inventory: "1",
  inventoryUnlimited: false,
  status: "active",
}

const fieldClass =
  "w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

const MAX_GALLERY = 10

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
    galleryUrls: [...(product.galleryUrls ?? [])],
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

  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadCover = async (file: File) => {
    setUploadError(null)
    setCoverUploading(true)
    try {
      const url = await uploadStoreProductImage(file)
      set({ imageUrl: url })
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Cover upload failed")
    } finally {
      setCoverUploading(false)
    }
  }

  const uploadGalleryFiles = async (files: FileList | File[]) => {
    setUploadError(null)
    const list = Array.from(files)
    const slotsLeft = MAX_GALLERY - values.galleryUrls.length
    if (slotsLeft <= 0) {
      setUploadError(`Gallery is limited to ${MAX_GALLERY} images`)
      return
    }

    setGalleryUploading(true)
    const nextUrls = [...values.galleryUrls]
    try {
      for (const file of list.slice(0, slotsLeft)) {
        const url = await uploadStoreProductImage(file)
        nextUrls.push(url)
      }
      set({ galleryUrls: nextUrls })
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Gallery upload failed")
      if (nextUrls.length !== values.galleryUrls.length) {
        set({ galleryUrls: nextUrls })
      }
    } finally {
      setGalleryUploading(false)
    }
  }

  const removeGalleryImage = (index: number) => {
    set({
      galleryUrls: values.galleryUrls.filter((_, i) => i !== index),
    })
  }

  const imageBusy = coverUploading || galleryUploading

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
        <p className={labelClass}>
          Cover image <span className="text-destructive">*</span>
        </p>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void uploadCover(file)
            e.target.value = ""
          }}
        />
        <div className="flex flex-wrap items-start gap-3">
          {values.imageUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-border/60 bg-muted aspect-[4/3] w-[200px]">
              <img
                src={values.imageUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => set({ imageUrl: "" })}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Remove cover image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 aspect-[4/3] w-[200px] flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              disabled={busy || imageBusy}
              onClick={() => coverInputRef.current?.click()}
            >
              {coverUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {values.imageUrl ? "Replace cover" : "Upload cover"}
            </Button>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              JPEG, PNG, or WebP. Shown as the main product image in your store.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className={labelClass}>
          Gallery images{" "}
          <span className="font-normal">(optional, max {MAX_GALLERY})</span>
        </p>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files
            if (files?.length) void uploadGalleryFiles(files)
            e.target.value = ""
          }}
        />
        {values.galleryUrls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {values.galleryUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative aspect-square rounded-lg overflow-hidden border border-border/60 bg-muted"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Remove gallery image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          disabled={
            busy || imageBusy || values.galleryUrls.length >= MAX_GALLERY
          }
          onClick={() => galleryInputRef.current?.click()}
        >
          {galleryUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Add gallery images
        </Button>
      </div>

      {uploadError && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          {uploadError}
        </p>
      )}

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
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 1 — zero stock is not allowed.
              </p>
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
          disabled={busy || imageBusy}
          onClick={() => void onSubmit()}
        >
          {busy ? "Saving…" : submitLabel ?? (mode === "create" ? "Publish product" : "Save changes")}
        </Button>
      </div>
    </div>
  )
}

export function validateProductForm(values: StoreProductFormValues): string | null {
  const title = values.title.trim()
  const imageUrl = values.imageUrl.trim()
  const price = parseFloat(values.priceUsd)
  if (!title || !imageUrl || !Number.isFinite(price) || price < 0.01) {
    return "Title, cover image, and a valid price are required"
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
  const galleryUrls = values.galleryUrls.map((url) => url.trim()).filter(Boolean).slice(0, MAX_GALLERY)
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
