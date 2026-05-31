"use client"

import { X, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CoinsModalProps {
  isOpen: boolean
  onClose: () => void
  currentCoins: number
  onPurchase: (amount: number) => void
}

import { COIN_PACKAGES } from "@/lib/mock-data"

const coinPackages = COIN_PACKAGES

export function CoinsModal({ isOpen, onClose, currentCoins, onPurchase }: CoinsModalProps) {
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
        {/* Header */}
        <div className="sticky top-0 bg-background px-4 py-4 border-b border-border z-10">
          <div className="w-12 h-1 rounded-full bg-muted mx-auto mb-4 md:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Get Coins</h3>
              <p className="text-sm text-muted-foreground">Support your favorite creators</p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Current balance */}
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

        {/* Coin packages */}
        <div className="px-4 pb-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Choose a Package</h4>
          <div className="grid grid-cols-2 gap-3">
            {coinPackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onPurchase(pkg.coins + (pkg.bonus ?? 0))}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02]",
                  pkg.popular 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-secondary/30 hover:border-primary/50"
                )}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    BEST VALUE
                  </span>
                )}
                <span className="text-3xl mb-2">🪙</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground">{pkg.coins.toLocaleString()}</span>
                  {pkg.bonus > 0 && (
                    <span className="text-sm font-bold text-primary">+{pkg.bonus}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground mt-1">{pkg.price}</span>
                {"bonus" in pkg && pkg.bonus > 0 && (
                  <span className="text-xs text-primary mt-1">
                    {Math.round((pkg.bonus / pkg.coins) * 100)}% Bonus!
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="px-4 py-4 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">What you can do with Coins</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Send Gifts</p>
                <p className="text-xs text-muted-foreground">Support streamers during live streams</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-xl">💬</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Super Chat</p>
                <p className="text-xs text-muted-foreground">Highlight your messages in live chat</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-xl">⭐</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Exclusive Content</p>
                <p className="text-xs text-muted-foreground">Unlock special creator content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Coins are non-refundable. By purchasing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  )
}
