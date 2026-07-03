"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Package,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { fulfillCheckout } from "@/lib/api/billing"
import { fetchMe } from "@/lib/api/users"
import { StoreProductSkeleton } from "@/components/content-skeletons"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Footer } from "@/components/footer"
import { BuyerDetailsForm } from "@/components/buyer-details-form"
import {
  buyerDetailsFromUser,
  EMPTY_BUYER_DETAILS,
  isBuyerDetailsComplete,
  shippingAddressFromBuyer,
  type BuyerDetails,
} from "@/lib/buyer-details"
import {
  createStoreCheckout,
  fetchStoreOrder,
  fetchStoreProduct,
  shippingLabel,
  stockLabel,
  type PublicStoreProduct,
} from "@/lib/api/stores"
import { addToStoreCart } from "@/lib/store-cart"
import { notifyStoreCartUpdated, StoreCartLink } from "@/components/store-cart-link"
import {
  creatorPath,
  creatorStorePath,
  normalizeUsernameSlug,
  usernamesMatch,
} from "@/lib/username-slug"

export default function StoreProductPage() {
  return (
    <Suspense
      fallback={<StoreProductSkeleton />}
    >
      <StoreProductPageInner />
    </Suspense>
  )
}

function StoreProductPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const rawSlug = String(params.slug ?? "")
  const slug = normalizeUsernameSlug(rawSlug)
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
  const [buyerDetails, setBuyerDetails] = useState<BuyerDetails>(EMPTY_BUYER_DETAILS)
  const [saveBuyerDetails, setSaveBuyerDetails] = useState(true)
  const [storeMeta, setStoreMeta] = useState({
    shippingFree: true,
    shippingFeeUsd: 0,
  })
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const [navTab, setNavTab] = useState("home")

  const isOwner =
    isAuthenticated &&
    usernamesMatch(user?.username, creatorUsername) &&
    user?.storeCreatorStatus === "approved"

  useEffect(() => {
    if (rawSlug === slug) return
    const qs = searchParams.toString()
    router.replace(`/creator/${slug}/store/${productId}${qs ? `?${qs}` : ""}`)
  }, [rawSlug, slug, productId, router, searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStoreProduct(slug, productId)
      setProduct(data.product)
      setStoreName(data.store.displayName)
      setStoreMeta({
        shippingFree: data.store.shippingFree,
        shippingFeeUsd: data.store.shippingFeeUsd,
      })
      setCreatorUsername(data.creatorUsername)
      setActiveImage(0)
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
    if (!isAuthenticated) {
      setBuyerDetails(EMPTY_BUYER_DETAILS)
      return
    }
    void fetchMe()
      .then((me) => setBuyerDetails(buyerDetailsFromUser(me)))
      .catch(() => {})
  }, [isAuthenticated])

  useEffect(() => {
    const checkout = searchParams.get("checkout")
    const sessionId = searchParams.get("session_id")
    const orderId = searchParams.get("order")
    if (checkout !== "success") return

    async function onSuccess() {
      setBusy(true)
      try {
        if (sessionId) await fulfillCheckout(sessionId)
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

  const shippingText = product ? shippingLabel(product) : null
  const unitPrice = Number(product?.priceUsd ?? 0)
  const shippingFee =
    product?.productType === "merchandise" && product.shippingFree === false
      ? Number(product.shippingFeeUsd ?? 0)
      : 0
  const orderTotal = product ? unitPrice * quantity + shippingFee : 0
  const isPhysical = product?.productType === "merchandise"
  const isDigital = product?.productType === "digital"

  const addToCart = () => {
    if (!product || !product.inStock) return
    setCartMessage(null)
    setError(null)
    try {
      addToStoreCart(
        creatorUsername,
        {
          displayName: storeName,
          shippingFree: storeMeta.shippingFree,
          shippingFeeUsd: storeMeta.shippingFeeUsd,
        },
        {
          id: product.id,
          title: product.title,
          priceUsd: product.priceUsd,
          imageUrl: product.imageUrl,
          productType: product.productType,
          inStock: product.inStock,
          inventory: product.inventory,
          inventoryUnlimited: product.inventoryUnlimited,
        },
        quantity,
      )
      notifyStoreCartUpdated()
      setCartMessage(`Added ${quantity} to cart`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to cart")
    }
  }

  const buy = async () => {
    if (!product || !product.inStock) return
    if (!isAuthenticated) {
      router.push(`/profile?auth=login&returnTo=${encodeURIComponent(`${creatorPath(slug)}/store/${productId}`)}`)
      return
    }
    if (isPhysical && !isBuyerDetailsComplete(buyerDetails)) {
      setError("Please complete your shipping details before checkout")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await createStoreCheckout(
        product.id,
        quantity,
        isPhysical
          ? { shippingAddress: shippingAddressFromBuyer(buyerDetails), saveBuyerDetails }
          : undefined,
      )
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
    return <StoreProductSkeleton />
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <Package className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error ?? "Product not found"}</p>
        <Link href={creatorPath(slug)}>
          <Button variant="outline" className="rounded-full">Back to creator</Button>
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center gap-2 px-4 py-3 md:px-8">
          <Link
            href={`${creatorStorePath(slug)}?tab=store`}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
            aria-label="Back to store"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <nav className="min-w-0 flex-1 text-xs text-muted-foreground truncate">
            <Link href={creatorPath(slug)} className="hover:text-foreground transition-colors">
              @{creatorUsername}
            </Link>
            <span className="mx-1.5">/</span>
            <Link href={`${creatorStorePath(slug)}?tab=store`} className="hover:text-foreground transition-colors">
              Store
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground font-medium truncate">{product.title}</span>
          </nav>
          {isOwner && (
            <Link href={`/profile?tab=store&edit=${productId}`}>
              <Button size="sm" variant="outline" className="rounded-full gap-1.5 shrink-0">
                <Pencil className="w-3.5 h-3.5" />
                Edit listing
              </Button>
            </Link>
          )}
          {!isOwner && <StoreCartLink creatorUsername={creatorUsername} />}
        </div>
      </div>

      {isOwner && (
        <div className="bg-primary/10 border-b border-primary/20">
          <p className="max-w-6xl mx-auto px-4 md:px-8 py-2 text-xs text-primary font-medium">
            You are viewing your own listing — buyers see this page when they shop.
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {error && (
          <p className="mb-6 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {purchaseDone && (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-5 md:p-6 space-y-3">
            <p className="font-semibold text-green-600 text-lg">Purchase successful</p>
            {isDigital && orderDigitalUrl && (
              <a href={orderDigitalUrl} target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full gap-2">
                  <Download className="w-4 h-4" />
                  Download your file
                </Button>
              </a>
            )}
            {isPhysical && (
              <p className="text-sm text-muted-foreground max-w-lg">
                The seller will fulfill your order. You will receive updates by email when configured.
              </p>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12 items-start">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-secondary/30 border border-border/60 aspect-square max-h-[min(72vh,640px)]">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImage]}
                    alt={product.title}
                    className="w-full h-full object-contain bg-[#0a0a0a]/5 dark:bg-black/20"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 border border-border shadow-sm flex items-center justify-center hover:bg-background"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 border border-border shadow-sm flex items-center justify-center hover:bg-background"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[280px]">
                  <Package className="w-16 h-16 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                      activeImage === i
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {product.description && (
              <div className="hidden lg:block rounded-2xl border border-border/60 bg-card/30 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  About this item
                </h2>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Purchase panel */}
          <div className="lg:sticky lg:top-20 space-y-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Store className="w-3.5 h-3.5" />
              <span>{storeName}</span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                {product.title}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
                    isPhysical
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      : "bg-violet-500/15 text-violet-600 dark:text-violet-400",
                  )}
                >
                  {isPhysical ? <Package className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                  {isPhysical ? "Physical" : "Digital"}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
                    product.inStock
                      ? "bg-green-500/15 text-green-600"
                      : "bg-destructive/15 text-destructive",
                  )}
                >
                  {stockLabel(product)}
                </span>
                {shippingText && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                    <Truck className="w-3 h-3" />
                    {shippingText}
                  </span>
                )}
              </div>
            </div>

            <p className="text-3xl font-bold text-primary">${unitPrice.toFixed(2)}</p>

            {product.description && (
              <p className="lg:hidden text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
                {product.description}
              </p>
            )}

            <div className="rounded-2xl border border-border/80 bg-card/50 shadow-sm p-5 space-y-5">
              {isPhysical && product.inStock && !product.inventoryUnlimited && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quantity</span>
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

              {isPhysical && product.inStock && !isOwner && (
                <div className="space-y-4 pt-1 border-t border-border/60">
                  <div>
                    <h3 className="text-sm font-semibold">Ship to</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Required for physical orders.
                    </p>
                  </div>
                  <BuyerDetailsForm value={buyerDetails} onChange={setBuyerDetails} disabled={busy} />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveBuyerDetails}
                      onChange={(e) => setSaveBuyerDetails(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-xs text-muted-foreground">Save for next purchase</span>
                  </label>
                </div>
              )}

              {isPhysical && (
                <div className="space-y-2 text-sm border-t border-border/60 pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${(unitPrice * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : "Free"}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border/50">
                    <span>Total</span>
                    <span className="text-primary text-lg">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {!isOwner ? (
                <div className="space-y-2">
                  {cartMessage && (
                    <p className="text-xs text-center text-green-600">{cartMessage}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full h-12 gap-2 font-semibold"
                      disabled={!product.inStock || busy}
                      onClick={addToCart}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to cart
                    </Button>
                    <Button
                      className="rounded-full h-12 gap-2 font-semibold"
                      disabled={!product.inStock || busy}
                      onClick={() => void buy()}
                    >
                      {busy ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        product.inStock ? "Buy now" : "Out of stock"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-center text-muted-foreground">
                    Checkout is disabled on your own listing.
                  </p>
                  <Link href={`/profile?tab=store&edit=${productId}`} className="block">
                    <Button variant="outline" className="w-full rounded-full gap-2">
                      <Pencil className="w-4 h-4" />
                      Manage in your store
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure checkout via Stripe
                {isDigital && <span>· Instant delivery after payment</span>}
              </div>
            </div>

            <Link
              href={`${creatorStorePath(slug)}?tab=store`}
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View all products from {storeName}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
    </main>
  )
}
