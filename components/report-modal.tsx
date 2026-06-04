"use client"

import { useState } from "react"
import { X, Flag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { submitReport, type ReportReason, type ReportTargetType } from "@/lib/api/reports"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam or misleading" },
  { id: "nudity", label: "Sexual content" },
  { id: "violence", label: "Violence or dangerous acts" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "other", label: "Other" },
]

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: string
  targetLabel?: string
}

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const { isAuthenticated } = useAuth()
  const [reason, setReason] = useState<ReportReason | "">("")
  const [description, setDescription] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reason || !isAuthenticated) return
    setSubmitting(true)
    setError(null)
    try {
      await submitReport({
        targetType,
        targetId,
        reason,
        details: description.trim() || undefined,
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setReason("")
        setDescription("")
        onClose()
      }, 1500)
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not submit report",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-background rounded-t-3xl md:rounded-2xl p-6 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-bold text-foreground">Report {targetType}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <p className="text-center py-8 text-muted-foreground">
            Sign in to submit a report.
          </p>
        ) : submitted ? (
          <p className="text-center py-8 text-muted-foreground">
            Report submitted. Thank you for keeping Prysym TV safe.
          </p>
        ) : (
          <>
            {targetLabel && (
              <p className="text-sm text-muted-foreground mb-4">Reporting: {targetLabel}</p>
            )}
            {error && (
              <p className="text-sm text-destructive mb-3 text-center">{error}</p>
            )}
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-colors",
                    reason === r.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-secondary/50",
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
            <Button
              onClick={() => void handleSubmit()}
              disabled={!reason || submitting}
              className="w-full rounded-full"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Report"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
