"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { fulfillCheckout } from "@/lib/api/billing"
import { fetchMe } from "@/lib/api/users"
import { StoreCartSkeleton } from "@/components/content-skeletons"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Footer } from "@/components/footer"
import {
  buyerDetailsFromUser,
  EMPTY_BUYER_DETAILS,
  isBuyerDetailsComplete,
  shippingAddressFromBuyer,
  type BuyerDetails,
} from "@/lib/buyer-details"
import { createStoreCartCheckout, fetchStoreOrder } from "@/lib/api/stores"
import {
  cartHasPhysical,
  cartShippingFee,
  cartSubtotal,
  cartTotal,
  clearStoreCart,
  getStoreCart,
  removeFromStoreCart,
  updateStoreCartQuantity,
  type StoreCart,
} from "@/lib/store-cart"

export default function StoreCartPage() {
  return (
    <Suspense
      fallback={<StoreCartSkeleton />}
    >
      <StoreCartPageInner />
    </Suspense>
  )
}

function StoreCartPageInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const slug = String(params.slug ?? "")

  const [cart, setCart] = useState<StoreCart | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purchaseDone, setPurchaseDone] = useState(false)
  const [buyerDetails, setBuyerDetails] = useState<BuyerDetails>(EMPTY_BUYER_DETAILS)
  const [saveBuyerDetails, setSaveBuyerDetails] = useState(true)
  const [navTab, setNavTab] = useState("home")

  const refreshCart = useCallback(() => {
    const next = getStoreCart()
    if (!next || next.creatorUsername !== slug) {
      setCart(next?.creatorUsername === slug ? next : null)
      if (next && next.creatorUsername !== slug) setCart(null)
      return
    }
    setCart(next)
  }, [slug])

  useEffect(() => {
    refreshCart()
    const onStorage = () => refreshCart()
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [refreshCart])

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
        if (orderId) await fetchStoreOrder(orderId)
        clearStoreCart()
        setPurchaseDone(true)
        refreshCart()
      } catch {
        setError("Payment received but order confirmation failed. Check your profile orders.")
      } finally {
        setBusy(false)
      }
    }
    void onSuccess()
  }, [searchParams, refreshCart])

  const needsShipping = cart ? cartHasPhysical(cart) : false

  const checkout = async () => {
    if (!cart?.items.length) return
    if (!isAuthenticated) {
      router.push(`/profile?auth=login&returnTo=${encodeURIComponent(`/creator/${slug}/store/cart`)}`)
      return
    }
    if (needsShipping && !isBuyerDetailsComplete(buyerDetails)) {
      setError("Please complete your shipping details before checkout")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await createStoreCartCheckout(
        cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        needsShipping
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
      clearStoreCart()
      setPurchaseDone(true)
      refreshCart()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed")
    } finally {
      setBusy(false)
    }
  }

  if (purchaseDone) {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
        <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Order placed</h1>
          <p className="text-muted-foreground text-sm">
            Thank you for your purchase from {cart?.storeName ?? "this store"}.
          </p>
          <Link href={`/creator/${slug}?tab=store`}>
            <Button className="rounded-full mt-4">Back to store</Button>
          </Link>
        </div>
        <Footer />
        <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <Link
          href={`/creator/${slug}?tab=store`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to store
        </Link>

        <h1 className="text-2xl font-bold mb-1">Your cart</h1>
        {cart && (
          <p className="text-sm text-muted-foreground mb-6">
            {cart.storeName} · {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
          </p>
        )}

        {!cart?.items.length ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border/80">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Your cart is empty.</p>
            <Link href={`/creator/${slug}?tab=store`}>
              <Button variant="outline" className="rounded-full">Browse products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 rounded-2xl border border-border/60 bg-card/40"
                >
                  <Link
                    href={`/creator/${slug}/store/${item.productId}`}
                    className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-muted"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/creator/${slug}/store/${item.productId}`}
                      className="font-semibold text-sm line-clamp-2 hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {item.productType}
                    </p>
                    <p className="text-sm font-bold mt-2">${item.priceUsd.toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        removeFromStoreCart(item.productId)
                        refreshCart()
                      }}
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full"
                        disabled={item.quantity <= 1}
                        onClick={() => {
                          updateStoreCartQuantity(item.productId, item.quantity - 1)
                          refreshCart()
                        }}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full"
                        disabled={item.maxQuantity != null && item.quantity >= item.maxQuantity}
                        onClick={() => {
                          updateStoreCartQuantity(item.productId, item.quantity + 1)
                          refreshCart()
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {needsShipping && (
              <div className="space-y-4 border-t border-border/60 pt-6">
                <div>
                  <h2 className="text-sm font-semibold">Ship to</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required because your cart includes physical items.
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

            <div className="rounded-2xl border border-border/60 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${cartSubtotal(cart).toFixed(2)}</span>
              </div>
              {needsShipping && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {cartShippingFee(cart) > 0
                      ? `$${cartShippingFee(cart).toFixed(2)}`
                      : "Free"}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="text-primary text-lg">${cartTotal(cart).toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full rounded-full h-12 gap-2 text-base font-semibold"
              disabled={busy}
              onClick={() => void checkout()}
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Checkout ({cart.items.length} item{cart.items.length === 1 ? "" : "s"})
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      <Footer />
      <BottomNavigation activeTab={navTab} onTabChange={setNavTab} />
    </main>
  )
}
