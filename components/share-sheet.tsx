"use client"

import { X, Link2, Check } from "lucide-react"
import { useState } from "react"

interface ShareSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url?: string
}

export function ShareSheet({ isOpen, onClose, title, url }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "")

  if (!isOpen) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full md:max-w-sm bg-background rounded-t-3xl md:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Share</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{title}</p>
        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
        >
          {copied ? <Check className="w-5 h-5 text-primary" /> : <Link2 className="w-5 h-5" />}
          {copied ? "Link copied!" : "Copy link"}
        </button>
        <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span>Twitter</span>
          <span>WhatsApp</span>
          <span>Email</span>
        </div>
      </div>
    </div>
  )
}
