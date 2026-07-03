"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { getStoreCart, getStoreCartCount } from "@/lib/store-cart"
import { cn } from "@/lib/utils"

type StoreCartLinkProps = {
  creatorUsername: string
  className?: string
}

export function StoreCartLink({ creatorUsername, className }: StoreCartLinkProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => {
      const cart = getStoreCart()
      setCount(cart?.creatorUsername === creatorUsername ? getStoreCartCount() : 0)
    }
    refresh()
    window.addEventListener("storage", refresh)
    window.addEventListener("prysym-cart-updated", refresh)
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("prysym-cart-updated", refresh)
    }
  }, [creatorUsername])

  if (count === 0) return null

  return (
    <Link
      href={`/creator/${creatorUsername}/store/cart`}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full border border-border/80 px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:text-primary transition-colors",
        className,
      )}
    >
      <ShoppingBag className="w-3.5 h-3.5" />
      Cart
      <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
        {count}
      </span>
    </Link>
  )
}

export function notifyStoreCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("prysym-cart-updated"))
  }
}
