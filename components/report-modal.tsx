"use client"

import { useState } from "react"
import { X, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const REASONS = [
  { id: "spam", label: "Spam or misleading" },
  { id: "nudity", label: "Sexual content" },
  { id: "violence", label: "Violence or dangerous acts" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "other", label: "Other" },
] as const

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: "video" | "comment" | "stream" | "user"
  targetLabel?: string
}

export function ReportModal({ isOpen, onClose, targetType, targetLabel }: ReportModalProps) {
  const [reason, setReason] = useState<string>("")
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!reason) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setReason("")
      setDescription("")
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full md:max-w-md bg-background rounded-t-3xl md:rounded-2xl p-6 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-bold text-foreground">Report {targetType}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <p className="text-center py-8 text-muted-foreground">Report submitted. Thank you for keeping Prysym TV safe.</p>
        ) : (
          <>
            {targetLabel && <p className="text-sm text-muted-foreground mb-4">Reporting: {targetLabel}</p>}
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-colors",
                    reason === r.id ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full h-24 px-4 py-3 rounded-xl bg-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <Button onClick={handleSubmit} disabled={!reason} className="w-full rounded-full">
              Submit Report
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
