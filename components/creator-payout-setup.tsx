"use client"

import { useEffect, useState } from "react"
import { CreditCard, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import {
  fetchCreatorPayoutProfile,
  saveCreatorPayoutProfile,
  type CreatorPayoutMethod,
  type CreatorPayoutProfile,
} from "@/lib/api/billing-monetization"

const METHOD_LABELS: Record<CreatorPayoutMethod, string> = {
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  crypto: "Crypto wallet",
}

const EMPTY_DETAILS: Record<CreatorPayoutMethod, Record<string, string>> = {
  paypal: { email: "" },
  bank_transfer: {
    accountHolder: "",
    bankName: "",
    routingNumber: "",
    accountNumber: "",
    accountType: "checking",
    country: "US",
  },
  crypto: { network: "USDC (Ethereum)", walletAddress: "" },
}

function maskValue(key: string, value: string) {
  if (key === "accountNumber" && value.length > 4) {
    return `••••${value.slice(-4)}`
  }
  if (key === "walletAddress" && value.length > 10) {
    return `${value.slice(0, 6)}…${value.slice(-4)}`
  }
  return value
}

function formatDetailLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
}

type CreatorPayoutSetupProps = {
  onConfigured?: () => void
}

export function CreatorPayoutSetup({ onConfigured }: CreatorPayoutSetupProps) {
  const [profile, setProfile] = useState<CreatorPayoutProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [method, setMethod] = useState<CreatorPayoutMethod>("paypal")
  const [details, setDetails] = useState(EMPTY_DETAILS.paypal)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = () => {
    setLoading(true)
    void fetchCreatorPayoutProfile()
      .then((res) => {
        setProfile(res)
        if (res.configured) {
          setMethod(res.method)
          setDetails({ ...EMPTY_DETAILS[res.method], ...res.details })
          setEditing(false)
        } else {
          setEditing(true)
        }
      })
      .catch(() => {
        setProfile({ configured: false })
        setEditing(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const switchMethod = (next: CreatorPayoutMethod) => {
    setMethod(next)
    setDetails({ ...EMPTY_DETAILS[next] })
    setMessage(null)
    setSaved(false)
  }

  const save = async () => {
    setBusy(true)
    setMessage(null)
    setSaved(false)
    try {
      const res = await saveCreatorPayoutProfile({ method, details })
      setProfile(res)
      setEditing(false)
      setSaved(true)
      onConfigured?.()
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not save payment method")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading payout settings…</p>
  }

  if (profile?.configured && !editing) {
    const d = profile.details
    return (
      <div className="p-4 md:p-5 rounded-xl border border-border bg-secondary/20 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold">Payout method</p>
              <p className="text-xs text-muted-foreground">
                {METHOD_LABELS[profile.method]} · saved for future withdrawals
              </p>
            </div>
          </div>
          {saved && <Check className="w-4 h-4 text-primary shrink-0" />}
        </div>
        <ul className="text-xs md:text-sm space-y-1">
          {Object.entries(d).map(([key, value]) => (
            <li key={key} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">{formatDetailLabel(key)}:</span>
              <span className="font-medium break-all">{maskValue(key, value)}</span>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setEditing(true)}
        >
          Change payment method
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
      <div>
        <p className="text-sm font-semibold">Set up how you get paid</p>
        <p className="text-xs text-muted-foreground mt-1">
          Choose your preferred payout method once. We save it for future withdrawal requests so
          admins know where to send your earnings.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(METHOD_LABELS) as CreatorPayoutMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMethod(m)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              method === m
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {METHOD_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {method === "paypal" && (
          <label className="block text-xs font-medium">
            PayPal email
            <input
              type="email"
              value={details.email ?? ""}
              onChange={(e) => setDetails({ email: e.target.value })}
              placeholder="you@example.com"
              className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
            />
          </label>
        )}

        {method === "bank_transfer" && (
          <>
            <label className="block text-xs font-medium">
              Account holder name
              <input
                value={details.accountHolder ?? ""}
                onChange={(e) => setDetails({ ...details, accountHolder: e.target.value })}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              Bank name
              <input
                value={details.bankName ?? ""}
                onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">
                Routing number
                <input
                  value={details.routingNumber ?? ""}
                  onChange={(e) => setDetails({ ...details, routingNumber: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
                />
              </label>
              <label className="block text-xs font-medium">
                Account number
                <input
                  value={details.accountNumber ?? ""}
                  onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-medium">
                Account type
                <select
                  value={details.accountType ?? "checking"}
                  onChange={(e) => setDetails({ ...details, accountType: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </label>
              <label className="block text-xs font-medium">
                Country
                <input
                  value={details.country ?? "US"}
                  onChange={(e) => setDetails({ ...details, country: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
                />
              </label>
            </div>
          </>
        )}

        {method === "crypto" && (
          <>
            <label className="block text-xs font-medium">
              Network
              <select
                value={details.network ?? ""}
                onChange={(e) => setDetails({ ...details, network: e.target.value })}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm"
              >
                <option value="USDC (Ethereum)">USDC (Ethereum)</option>
                <option value="USDC (Solana)">USDC (Solana)</option>
                <option value="Bitcoin">Bitcoin</option>
              </select>
            </label>
            <label className="block text-xs font-medium">
              Wallet address
              <input
                value={details.walletAddress ?? ""}
                onChange={(e) => setDetails({ ...details, walletAddress: e.target.value })}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-background border border-border text-sm font-mono text-xs"
              />
            </label>
          </>
        )}
      </div>

      {message && <p className="text-xs text-destructive">{message}</p>}

      <div className="flex gap-2">
        {profile?.configured && (
          <Button
            variant="secondary"
            className="rounded-full flex-1"
            onClick={() => setEditing(false)}
            disabled={busy}
          >
            Cancel
          </Button>
        )}
        <Button className="rounded-full flex-1" onClick={() => void save()} disabled={busy}>
          {busy ? "Saving…" : "Save payment method"}
        </Button>
      </div>
    </div>
  )
}
