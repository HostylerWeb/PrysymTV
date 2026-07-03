"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Download, Loader2, Package, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { fulfillCheckout } from "@/lib/api/billing"
import {
  createStoreCheckout,
  fetchStoreOrder,
  fetchStoreProduct,
  stockLabel,
  type PublicStoreProduct,
} from "@/lib/api/stores"

export default function StoreProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StoreProductPageInner />
    </Suspense>
  )
}

function StoreProductPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const slug = String(params.slug ?? "")
  const productId = String(params.productId ?? "")

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<PublicStoreProduct | null>(null)
  const [storeName, setStoreName] = useState("")
  const [creatorUsername, setCreatorUsername] = useState(slug)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [orderDigitalUrl, setOrderDigitalUrl] = useState<string | null>(null)
  const [purchaseDone, setPurchaseDone] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStoreProduct(slug, productId)
      setProduct(data.product)
      setStoreName(data.store.displayName)
      setCreatorUsername(data.creatorUsername)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Product not found")
    } finally {
      setLoading(false)
    }
  }, [slug, productId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const checkout = searchParams.get("checkout")
    const sessionId = searchParams.get("session_id")
    const orderId = searchParams.get("order")
    if (checkout !== "success") return

    async function onSuccess() {
      setBusy(true)
      try {
        if (sessionId) {
          await fulfillCheckout(sessionId)
        }
        if (orderId) {
          const order = await fetchStoreOrder(orderId)
          const digital = order.lines.find((l) => l.product.digitalUrl)?.product.digitalUrl
          if (digital) setOrderDigitalUrl(digital)
        }
        setPurchaseDone(true)
        void load()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not confirm payment")
      } finally {
        setBusy(false)
      }
    }
    void onSuccess()
  }, [searchParams, load])

  const images = product
    ? [product.imageUrl, ...(product.galleryUrls ?? [])].filter(Boolean) as string[]
    : []

  const buy = async () => {
    if (!product || !product.inStock) return
    if (!isAuthenticated) {
      router.push(`/profile?auth=login&returnTo=${encodeURIComponent(`/creator/${slug}/store/${productId}`)}`)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await createStoreCheckout(product.id, quantity)
      if (res.devMode && res.redirectUrl) {
        window.location.href = res.redirectUrl
        return
      }
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
        return
      }
      setPurchaseDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">{error ?? "Product not found"}</p>
        <Link href={`/creator/${slug}`}>
          <Button variant="outline" className="rounded-full">Back to creator</Button>
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <Link href={`/creator/${slug}`} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{storeName}</p>
            <h1 className="text-sm font-semibold truncate">{product.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {purchaseDone && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 space-y-2">
            <p className="font-semibold text-green-600">Purchase successful!</p>
            {product.productType === "digital" && orderDigitalUrl && (
              <a href={orderDigitalUrl} target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full gap-2 mt-2">
                  <Download className="w-4 h-4" />
                  Download your file
                </Button>
              </a>
            )}
            {product.productType === "merchandise" && (
              <p className="text-sm text-muted-foreground">
                The seller will fulfill your physical order. You will receive updates by email if configured.
              </p>
            )}
          </div>
        )}

        <div className="rounded-xl overflow-hidden bg-muted aspect-square max-h-[420px]">
          {images.length > 0 ? (
            <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center min-h-[240px]">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((url, i) => (
              <button
                key={url + i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={cn(
                  "shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                  activeImage === i ? "border-primary" : "border-transparent opacity-70",
                )}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{product.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {product.productType === "merchandise" ? "Physical product" : "Digital download"} · {stockLabel(product)}
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">${product.priceUsd.toFixed(2)}</p>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          )}

          {product.productType === "merchandise" && product.inStock && !product.inventoryUnlimited && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 rounded-full"
                  disabled={product.inventory != null && quantity >= product.inventory}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          )}

          <Button
            className="w-full rounded-full h-12 gap-2 text-base"
            disabled={!product.inStock || busy}
            onClick={() => void buy()}
          >
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                {product.inStock ? "Buy now" : "Out of stock"}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Secure checkout via Stripe. Digital items deliver instantly after payment.
          </p>
        </div>
      </div>
    </main>
  )
}
