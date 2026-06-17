"use client"

import { cn } from "@/lib/utils"
import { giftIconFor } from "@/lib/gift-icons"

export type StreamChatLine = {
  id: string
  user: string
  message: string
  color: string
  type?: "message" | "gift"
  giftName?: string
  giftIcon?: string
  coins?: number
}

export function StreamChatLine({ msg }: { msg: StreamChatLine }) {
  if (msg.type === "gift") {
    const icon = msg.giftIcon ?? giftIconFor(msg.giftName)
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-pink-500/35 bg-gradient-to-r from-pink-500/15 via-amber-500/10 to-purple-500/15 px-3 py-2.5 shadow-sm">
        <span className="text-2xl shrink-0 leading-none" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 text-sm leading-snug">
          <span className={cn("font-bold", msg.color)}>{msg.user}</span>
          <span className="text-foreground/90"> sent </span>
          <span className="font-semibold text-pink-400">{msg.giftName ?? "a gift"}</span>
          {msg.coins != null && msg.coins > 0 && (
            <span className="text-muted-foreground text-xs ml-1">· 🪙 {msg.coins}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 text-sm">
      <span className={cn("font-semibold shrink-0", msg.color)}>{msg.user}:</span>
      <span className="break-words">{msg.message}</span>
    </div>
  )
}
