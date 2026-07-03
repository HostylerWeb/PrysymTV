"use client"

import Link from "next/link"
import type { CreatorStoreSummary, PublicStoreProduct } from "@/lib/api/stores"
import { stockLabel, shippingLabel } from "@/lib/api/stores"
import { Package } from "lucide-react"

type CreatorStoreTabProps = {
  store: CreatorStoreSummary
  products: PublicStoreProduct[]
  creatorUsername: string
}

export function CreatorStoreTab({ store, products, creatorUsername }: CreatorStoreTabProps) {
  return (
    <div className="space-y-6">
      {store.description && (
        <p className="text-sm text-muted-foreground max-w-2xl">{store.description}</p>
      )}
      {products.some((p) => p.productType === "merchandise") && (
        <p className="text-xs text-muted-foreground">
          Physical orders: {store.shippingFree ? "free shipping" : `flat $${store.shippingFeeUsd.toFixed(2)} shipping`}
        </p>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border/80">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products listed yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/creator/${creatorUsername}/store/${p.id}`}
              className="rounded-xl border border-border/80 overflow-hidden bg-card/40 hover:border-primary/40 transition-colors group"
            >
              {p.imageUrl ? (
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-sm font-bold text-foreground">${p.priceUsd.toFixed(2)}</p>
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                    {p.productType === "merchandise" ? "Physical" : "Digital"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{stockLabel(p)}</p>
                {p.productType === "merchandise" && shippingLabel({ ...p, shippingFree: store.shippingFree, shippingFeeUsd: store.shippingFeeUsd }) && (
                  <p className="text-xs text-muted-foreground">
                    {shippingLabel({ ...p, shippingFree: store.shippingFree, shippingFeeUsd: store.shippingFeeUsd })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
