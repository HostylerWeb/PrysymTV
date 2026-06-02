"use client"

import { useEffect, useState } from "react"
import { X, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchCoinPackages, type CoinPackage } from "@/lib/api/billing"
import { COIN_PACKAGES } from "@/lib/mock-data"

interface CoinsModalProps {
  isOpen: boolean
  onClose: () => void
  currentCoins: number
  onPurchasePackage: (packageId: string) => void | Promise<void>
  purchasing?: boolean
}

export function CoinsModal({
  isOpen,
  onClose,
  currentCoins,
  onPurchasePackage,
  purchasing = false,
}: CoinsModalProps) {
  const [packages, setPackages] = useState<CoinPackage[]>([])

  useEffect(() => {
    if (!isOpen) return
    void fetchCoinPackages().then((items) => {
      if (items.length) setPackages(items)
      else {
        setPackages(
          COIN_PACKAGES.map((p) => ({
            id: p.id,
            coins: p.coins,
            priceUsd: p.price,
            label: p.id,
          })),
        )
      }
    })
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full md:w-[450px] bg-background rounded-t-3xl md:rounded-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom md:zoom-in-95 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background px-4 py-4 border-b border-border z-10">
          <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-4 md:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Get Coins</h3>
              <p className="text-sm text-muted-foreground">Support your favorite creators</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🪙</span>
                  <span className="text-3xl font-bold text-foreground">{currentCoins.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Choose a Package</h4>
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg, i) => {
              const price =
                typeof pkg.priceUsd === "number"
                  ? `$${pkg.priceUsd.toFixed(2)}`
                  : `$${pkg.priceUsd}`
              return (
                <button
                  key={pkg.id}
                  type="button"
                  disabled={purchasing}
                  onClick={() => void onPurchasePackage(pkg.id)}
                  className={cn(
                    "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02] disabled:opacity-60",
                    i === 1 ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:border-primary/50",
                  )}
                >
                  <span className="text-3xl mb-2">🪙</span>
                  <span className="text-lg font-bold text-foreground">{pkg.coins.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-foreground mt-1">{price}</span>
                  <span className="text-xs text-muted-foreground mt-1">{pkg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Coins are non-refundable. By purchasing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
