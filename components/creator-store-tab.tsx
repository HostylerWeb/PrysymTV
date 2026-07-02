"use client"

import { Package } from "lucide-react"
import type { CreatorStoreSummary, PublicStoreProduct } from "@/lib/api/stores"

type CreatorStoreTabProps = {
  store: CreatorStoreSummary
  products: PublicStoreProduct[]
}

export function CreatorStoreTab({ store, products }: CreatorStoreTabProps) {
  return (
    <div className="space-y-6">
      {store.description && (
        <p className="text-sm text-muted-foreground max-w-2xl">{store.description}</p>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border/80">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products listed yet.</p>
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
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2">{p.title}</h3>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-sm font-bold text-foreground">${p.priceUsd.toFixed(2)}</p>
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                    {p.productType === "merchandise" ? "Physical" : "Digital"}
                  </span>
                </div>
                {p.productType === "merchandise" && p.inventory != null && (
                  <p className="text-xs text-muted-foreground">
                    {p.inventory > 0 ? `${p.inventory} in stock` : "Out of stock"}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
