"use client"

import { useEffect, useState } from "react"
import { X, Loader2, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  cancelAdvertiserRegistration,
  fetchMyAdvertiserAccounts,
  registerAdvertiserAccount,
  type AdvertiserAccount,
} from "@/lib/api/advertisers"
import { isValidEmail } from "@/lib/validation/email"

type AdvertiserRegisterModalProps = {
  isOpen: boolean
  onClose: () => void
  accounts: AdvertiserAccount[]
  onAccountsChange: (accounts: AdvertiserAccount[]) => void
}

export function AdvertiserRegisterModal({
  isOpen,
  onClose,
  accounts,
  onAccountsChange,
}: AdvertiserRegisterModalProps) {
  const [companyName, setCompanyName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [billingEmail, setBillingEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [contactEmailError, setContactEmailError] = useState<string | null>(null)
  const [billingEmailError, setBillingEmailError] = useState<string | null>(null)

  const verifiedAccounts = accounts.filter((a) => a.isVerified)
  const pendingAccount = accounts.find((a) => !a.isVerified) ?? null
  const hasPending = pendingAccount !== null

  const contactEmailTrimmed = contactEmail.trim()
  const billingEmailTrimmed = billingEmail.trim()
  const contactEmailValid = isValidEmail(contactEmailTrimmed)
  const billingEmailValid = !billingEmailTrimmed || isValidEmail(billingEmailTrimmed)
  const canSubmit =
    !hasPending && companyName.trim().length > 0 && contactEmailValid && billingEmailValid

  useEffect(() => {
    if (!isOpen) return
    setMessage(null)
    void fetchMyAdvertiserAccounts()
      .then(onAccountsChange)
      .catch(() => onAccountsChange([]))
  }, [isOpen, onAccountsChange])

  if (!isOpen) return null

  const validateEmails = () => {
    let valid = true
    if (!contactEmailTrimmed) {
      setContactEmailError("Contact email is required")
      valid = false
    } else if (!isValidEmail(contactEmailTrimmed)) {
      setContactEmailError("Enter a valid email address")
      valid = false
    } else {
      setContactEmailError(null)
    }
    if (billingEmailTrimmed && !isValidEmail(billingEmailTrimmed)) {
      setBillingEmailError("Enter a valid email address")
      valid = false
    } else {
      setBillingEmailError(null)
    }
    return valid
  }

  const register = async () => {
    if (hasPending || !validateEmails() || !companyName.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const created = await registerAdvertiserAccount({
        companyName: companyName.trim(),
        contactEmail: contactEmailTrimmed.toLowerCase(),
        billingEmail: billingEmailTrimmed ? billingEmailTrimmed.toLowerCase() : undefined,
      })
      onAccountsChange([created, ...accounts])
      setCompanyName("")
      setContactEmail("")
      setBillingEmail("")
      setMessage(
        "Registration submitted. We'll review your business and notify you when your account is approved.",
      )
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setBusy(false)
    }
  }

  const cancelPending = async (id: string) => {
    setCancellingId(id)
    setMessage(null)
    try {
      await cancelAdvertiserRegistration(id)
      onAccountsChange(accounts.filter((a) => a.id !== id))
      setMessage("Pending registration cancelled. You can submit a new request below.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not cancel registration")
    } finally {
      setCancellingId(null)
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
        <div className="relative px-6 pt-6 pb-4 border-b border-border">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold pr-10">Advertiser account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Register your business to advertise on Prysym TV.
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {verifiedAccounts.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Verified accounts</h3>
              <ul className="space-y-2">
                {verifiedAccounts.map((a) => (
                  <li
                    key={a.id}
                    className="p-3 rounded-xl border border-green-500/25 bg-green-500/5 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.contactEmail}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold uppercase text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pendingAccount && (
            <section className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Pending registration</h3>
                  <p className="font-medium truncate mt-1">{pendingAccount.companyName}</p>
                  <p className="text-xs text-muted-foreground truncate">{pendingAccount.contactEmail}</p>
                </div>
                <span className="inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                  <Clock className="w-3 h-3" />
                  Under review
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                We&apos;re reviewing this request. Cancel it if you need to submit different details.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                disabled={cancellingId === pendingAccount.id}
                onClick={() => void cancelPending(pendingAccount.id)}
              >
                {cancellingId === pendingAccount.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Cancel pending request"
                )}
              </Button>
            </section>
          )}

          {!hasPending && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                {verifiedAccounts.length > 0 ? "Register another business" : "Register your business"}
              </h3>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                className="w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <div>
                <input
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value)
                    if (contactEmailError) setContactEmailError(null)
                  }}
                  onBlur={() => {
                    if (!contactEmailTrimmed) {
                      setContactEmailError("Contact email is required")
                    } else if (!isValidEmail(contactEmailTrimmed)) {
                      setContactEmailError("Enter a valid email address")
                    } else {
                      setContactEmailError(null)
                    }
                  }}
                  placeholder="Contact email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  aria-invalid={!!contactEmailError}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    contactEmailError && "ring-2 ring-destructive/60",
                  )}
                />
                {contactEmailError && (
                  <p className="text-xs text-destructive mt-1.5">{contactEmailError}</p>
                )}
              </div>
              <div>
                <input
                  value={billingEmail}
                  onChange={(e) => {
                    setBillingEmail(e.target.value)
                    if (billingEmailError) setBillingEmailError(null)
                  }}
                  onBlur={() => {
                    if (billingEmailTrimmed && !isValidEmail(billingEmailTrimmed)) {
                      setBillingEmailError("Enter a valid email address")
                    } else {
                      setBillingEmailError(null)
                    }
                  }}
                  placeholder="Billing email (optional)"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-invalid={!!billingEmailError}
                  className={cn(
                    "w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    billingEmailError && "ring-2 ring-destructive/60",
                  )}
                />
                {billingEmailError && (
                  <p className="text-xs text-destructive mt-1.5">{billingEmailError}</p>
                )}
              </div>
              {message && (
                <p
                  className={cn(
                    "text-sm rounded-lg px-3 py-2",
                    message.includes("submitted") || message.includes("cancelled")
                      ? "text-green-700 dark:text-green-400 bg-green-500/10"
                      : "text-muted-foreground bg-secondary/60",
                  )}
                >
                  {message}
                </p>
              )}
              <Button
                className="w-full rounded-full"
                disabled={busy || !canSubmit}
                onClick={() => void register()}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit registration"}
              </Button>
            </section>
          )}

          {hasPending && message && (
            <p
              className={cn(
                "text-sm rounded-lg px-3 py-2",
                message.includes("cancelled")
                  ? "text-green-700 dark:text-green-400 bg-green-500/10"
                  : "text-muted-foreground bg-secondary/60",
              )}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
