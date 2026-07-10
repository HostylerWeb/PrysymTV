import { normalizeUsernameSlug } from "@/lib/username-slug"

export type StoreCartItem = {
  productId: string
  title: string
  priceUsd: number
  imageUrl: string | null
  productType: "digital" | "merchandise" | "ticket" | "course"
  quantity: number
  inStock: boolean
  maxQuantity: number | null
}

export type StoreCart = {
  creatorUsername: string
  storeName: string
  shippingFree: boolean
  shippingFeeUsd: number
  items: StoreCartItem[]
  updatedAt: string
}

const CART_KEY = "prysym_store_cart"

function readRaw(): StoreCart | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoreCart
  } catch {
    return null
  }
}

function writeRaw(cart: StoreCart | null) {
  if (typeof window === "undefined") return
  if (!cart || cart.items.length === 0) {
    localStorage.removeItem(CART_KEY)
    return
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

export function getStoreCart(): StoreCart | null {
  return readRaw()
}

export function getStoreCartCount(): number {
  const cart = readRaw()
  if (!cart) return 0
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export function clearStoreCart() {
  writeRaw(null)
}

export function addToStoreCart(
  creatorUsername: string,
  store: { displayName: string; shippingFree: boolean; shippingFeeUsd: number },
  product: {
    id: string
    title: string
    priceUsd: number
    imageUrl: string | null
    productType: "digital" | "merchandise" | "ticket" | "course"
    inStock: boolean
    inventory: number | null
    inventoryUnlimited: boolean
  },
  quantity = 1,
): StoreCart {
  const existing = readRaw()
  const creatorSlug = normalizeUsernameSlug(creatorUsername)
  if (existing && normalizeUsernameSlug(existing.creatorUsername) !== creatorSlug) {
    throw new Error("Your cart has items from another store. Clear it first to shop here.")
  }

  const maxQuantity =
    product.productType === "merchandise" && !product.inventoryUnlimited && product.inventory != null
      ? product.inventory
      : 99

  const items = existing?.items ?? []
  const idx = items.findIndex((i) => i.productId === product.id)
  const nextQty = (idx >= 0 ? items[idx].quantity : 0) + quantity
  if (nextQty > maxQuantity) {
    throw new Error(`Only ${maxQuantity} available for ${product.title}`)
  }

  const nextItem: StoreCartItem = {
    productId: product.id,
    title: product.title,
    priceUsd: product.priceUsd,
    imageUrl: product.imageUrl,
    productType: product.productType,
    quantity: nextQty,
    inStock: product.inStock,
    maxQuantity,
  }

  const nextItems =
    idx >= 0
      ? items.map((item, i) => (i === idx ? nextItem : item))
      : [...items, nextItem]

  const cart: StoreCart = {
    creatorUsername: creatorSlug,
    storeName: store.displayName,
    shippingFree: store.shippingFree,
    shippingFeeUsd: store.shippingFeeUsd,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  }
  writeRaw(cart)
  return cart
}

export function updateStoreCartQuantity(productId: string, quantity: number): StoreCart | null {
  const cart = readRaw()
  if (!cart) return null
  if (quantity <= 0) {
    return removeFromStoreCart(productId)
  }
  const nextItems = cart.items.map((item) => {
    if (item.productId !== productId) return item
    const max = item.maxQuantity ?? 99
    return { ...item, quantity: Math.min(quantity, max) }
  })
  const next = { ...cart, items: nextItems, updatedAt: new Date().toISOString() }
  writeRaw(next)
  return next
}

export function removeFromStoreCart(productId: string): StoreCart | null {
  const cart = readRaw()
  if (!cart) return null
  const nextItems = cart.items.filter((i) => i.productId !== productId)
  if (!nextItems.length) {
    writeRaw(null)
    return null
  }
  const next = { ...cart, items: nextItems, updatedAt: new Date().toISOString() }
  writeRaw(next)
  return next
}

export function cartSubtotal(cart: StoreCart): number {
  return cart.items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0)
}

export function cartHasPhysical(cart: StoreCart): boolean {
  return cart.items.some((item) => item.productType === "merchandise")
}

export function cartShippingFee(cart: StoreCart): number {
  return cartHasPhysical(cart) ? (cart.shippingFree ? 0 : cart.shippingFeeUsd) : 0
}

export function cartTotal(cart: StoreCart): number {
  return cartSubtotal(cart) + cartShippingFee(cart)
}
