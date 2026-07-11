"use client"

import { cn } from "@/lib/utils"
import { giftCatalogIcon, isGiftImageUrl } from "@/lib/gift-icons"

type GiftIconProps = {
  value: string
  className?: string
  size?: number
}

export function GiftIcon({ value, className, size = 32 }: GiftIconProps) {
  if (isGiftImageUrl(value)) {
    return (
      <img
        src={value}
        alt=""
        width={size}
        height={size}
        className={cn("object-contain shrink-0", className)}
      />
    )
  }
  return (
    <span
      className={cn("leading-none shrink-0", className)}
      style={{ fontSize: Math.round(size * 0.75) }}
      aria-hidden
    >
      {value}
    </span>
  )
}

type GiftCatalogIconProps = {
  gift: { imageUrl?: string | null; animationKey?: string; id?: string }
  className?: string
  size?: number
}

export function GiftCatalogIcon({ gift, className, size = 32 }: GiftCatalogIconProps) {
  return <GiftIcon value={giftCatalogIcon(gift)} className={className} size={size} />
}
