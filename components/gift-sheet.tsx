"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchGiftCatalog, sendGift } from "@/lib/api/billing"
import { giftCatalogIcon } from "@/lib/gift-icons"
import { GiftIcon } from "@/components/gift-icon"
import { useAuth } from "@/contexts/auth-context"

type GiftSheetProps = {
  isOpen: boolean
  onClose: () => void
  receiverId: string
  receiverName?: string
  streamId?: string
  videoId?: string
  onSent?: () => void
  onNeedAuth?: () => void
}

export function GiftSheet({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  streamId,
  videoId,
  onSent,
  onNeedAuth,
}: GiftSheetProps) {
  const { user, isAuthenticated, refreshUser } = useAuth()
  const [catalog, setCatalog] = useState<
    Array<{ id: string; name: string; cost: number; icon: string }>
  >([])
  const [busy, setBusy] = useState(false)
  const userCoins = user?.coins ?? 0

  useEffect(() => {
    if (!isOpen) return
    void fetchGiftCatalog()
      .then((items) =>
        setCatalog(
          items.map((g) => ({
            id: g.id,
            name: g.name,
            cost: g.coinCost,
            icon: giftCatalogIcon(g),
          })),
        ),
      )
      .catch(() => setCatalog([]))
  }, [isOpen])

  if (!isOpen) return null

  const handleSend = async (gift: { id: string; cost: number }) => {
    if (!isAuthenticated) {
      onNeedAuth?.()
      return
    }
    if (userCoins < gift.cost) return
    setBusy(true)
    try {
      await sendGift({
        giftId: gift.id,
        receiverId,
        streamId,
        videoId,
      })
      await refreshUser()
      onSent?.()
      onClose()
    } catch {
      /* balance unchanged on failure */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-[450px] bg-background rounded-t-3xl md:rounded-3xl p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 gap-3">
          <div>
            <h3 className="font-bold text-lg">Send a gift</h3>
            {receiverName ? (
              <p className="text-xs text-muted-foreground mt-0.5">Support {receiverName}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">🪙 {userCoins.toLocaleString()}</span>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {catalog.map((gift) => (
            <button
              key={gift.id}
              type="button"
              disabled={busy || userCoins < gift.cost}
              onClick={() => void handleSend(gift)}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl bg-secondary transition-opacity",
                (busy || userCoins < gift.cost) && "opacity-50",
              )}
            >
              <GiftIcon value={gift.icon} size={36} />
              <span className="text-sm font-medium">{gift.name}</span>
              <span className="text-xs">🪙 {gift.cost}</span>
            </button>
          ))}
        </div>
        <Link href="/profile">
          <Button variant="secondary" className="w-full rounded-full mt-4">
            Get more coins
          </Button>
        </Link>
      </div>
    </div>
  )
}
