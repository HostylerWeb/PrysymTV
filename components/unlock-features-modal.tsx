"use client"

import Link from "next/link"
import { useState } from "react"
import { X, Loader2, CheckCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth, getAuthErrorMessage } from "@/contexts/auth-context"
import {
  getCreatorCapabilities,
  isIdentityVerified,
} from "@/lib/creator-capabilities"
import { requestCreatorAccess } from "@/lib/api/users"

export type CreatorVerificationContext = {
  description?: string
  portfolioUrl?: string
  features: Array<"vertical" | "live" | "store">
}

type UnlockFeature = "vertical" | "live" | "store"

interface UnlockFeaturesModalProps {
  isOpen: boolean
  onClose: () => void
  onNeedCreatorVerification: (context: CreatorVerificationContext) => void
  preselect?: UnlockFeature
}

export function UnlockFeaturesModal({
  isOpen,
  onClose,
  onNeedCreatorVerification,
  preselect,
}: UnlockFeaturesModalProps) {
  const { user, refreshUser } = useAuth()
  const [selected, setSelected] = useState<Set<UnlockFeature>>(() => {
    const s = new Set<UnlockFeature>()
    if (preselect) s.add(preselect)
    return s
  })
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  if (!isOpen || !user) return null

  const verified = isIdentityVerified(user)
  const caps = getCreatorCapabilities(user)

  const toggle = (id: UnlockFeature) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allOptions: Array<{
    id: UnlockFeature
    label: string
    allowed: boolean
    pending: boolean
  }> = [
    {
      id: "vertical",
      label: "Vertical series",
      allowed: caps.find((c) => c.id === "verticals")?.allowed ?? false,
      pending: user.verticalCreatorStatus === "pending",
    },
    {
      id: "live",
      label: "Live streaming",
      allowed: caps.find((c) => c.id === "live")?.allowed ?? false,
      pending: user.streamerStatus === "pending",
    },
    {
      id: "store",
      label: "Creator Store",
      allowed: user.storeCreatorStatus === "approved",
      pending: user.storeCreatorStatus === "pending",
    },
  ]
  const lockedOptions = allOptions.filter((o) => !o.allowed)

  const needsLive =
    selected.has("live") && user.streamerStatus !== "approved"
  const needsVertical =
    selected.has("vertical") && user.verticalCreatorStatus !== "approved"
  const needsStore = selected.has("store")
  const needsIdVerification =
    !verified && (needsLive || needsVertical)

  const nextStepHint = verified
    ? needsStore && !needsLive && !needsVertical
      ? "Store requests are reviewed by our team before you can list products."
      : "Selected features unlock immediately where eligible; store access is reviewed by admin."
    : needsIdVerification
      ? "Next step: upload a government-issued ID. The same document is used for all selected permissions."
      : needsStore
        ? "Store requests are submitted for admin review."
        : null

  const handleSubmit = async () => {
    if (selected.size === 0) return

    const desc = description.trim() || undefined

    setBusy(true)
    setError("")
    try {
      if (verified || needsStore) {
        const res = await requestCreatorAccess({
          features: Array.from(selected),
          description: desc,
          acceptedStoreTerms: selected.has("store") ? true : undefined,
        })
        await refreshUser()
        if (
          res.results?.live === "needs_id_verification" ||
          res.results?.vertical === "needs_id_verification"
        ) {
          onClose()
          onNeedCreatorVerification({
            description: desc,
            features: Array.from(selected).filter((f) => {
              if (f === "store") return false
              if (f === "live" && user.streamerStatus === "approved") return false
              if (f === "vertical" && user.verticalCreatorStatus === "approved")
                return false
              return true
            }),
          })
          return
        }
        setDone(true)
        return
      }

      if (needsIdVerification) {
        onClose()
        onNeedCreatorVerification({
          description: desc,
          features: [
            ...(needsVertical ? (["vertical"] as const) : []),
            ...(needsLive ? (["live"] as const) : []),
            ...(needsStore ? (["store"] as const) : []),
          ],
        })
        return
      }

      setDone(true)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-center pr-10">
            {verified ? "Unlock features" : "Request permissions"}
          </h2>
          {verified && (
            <p className="text-sm text-muted-foreground text-center mt-2 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              ID verified — instant unlock where eligible
            </p>
          )}
        </div>

        <div className="px-6 pb-8 space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg py-2">
              {error}
            </p>
          )}

          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="font-semibold mb-2">Request submitted</p>
              <p className="text-sm text-muted-foreground mb-6">
                {selected.has("store")
                  ? "We will review your Creator Store request. Other approved features are available on your profile."
                  : "Approved features are now available on your profile."}
              </p>
              <Button onClick={onClose} className="w-full rounded-full">
                Done
              </Button>
            </div>
          ) : (
            <>
              {lockedOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  You already have access to all creator features.
                </p>
              ) : (
                <div className="space-y-2">
                  {lockedOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={opt.pending}
                      onClick={() => toggle(opt.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors",
                        selected.has(opt.id)
                          ? "border-primary bg-primary/5"
                          : "border-border",
                        opt.pending && "opacity-60",
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                          selected.has(opt.id)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground",
                        )}
                      >
                        {selected.has(opt.id) && (
                          <span className="text-primary-foreground text-xs">✓</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {opt.pending
                            ? "Application pending review"
                            : opt.id === "store"
                              ? "Admin review required"
                              : verified
                                ? "Instant unlock"
                                : "Requires ID verification"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selected.has("store") && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 leading-relaxed">
                  By requesting Creator Store access, you confirm you have read our{" "}
                  <Link href="/terms" className="underline font-medium" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/guidelines" className="underline font-medium" target="_blank">
                    Community Guidelines
                  </Link>
                  . Illegal products or services will result in an immediate account ban.
                </p>
              )}

              {nextStepHint && (
                <p className="text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2.5 leading-relaxed">
                  {nextStepHint}
                </p>
              )}

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  verified
                    ? "Optional note for your unlock request"
                    : "What will you create? (used for your application)"
                }
                className="w-full h-24 px-4 py-3 rounded-xl bg-secondary text-sm resize-none"
                maxLength={2000}
              />

              <Button
                onClick={() => void handleSubmit()}
                disabled={busy || selected.size === 0}
                className="w-full rounded-full"
              >
                {busy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : verified ? (
                  "Unlock selected"
                ) : needsIdVerification ? (
                  "Continue to ID verification"
                ) : (
                  "Submit request"
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** @deprecated use CreatorVerificationContext */
export type StreamerVerificationContext = CreatorVerificationContext
