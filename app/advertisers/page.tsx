"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchMyAdvertiserAccounts,
  registerAdvertiserAccount,
  type AdvertiserAccount,
} from "@/lib/api/advertisers"

export default function AdvertisersPortalPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [accounts, setAccounts] = useState<AdvertiserAccount[]>([])
  const [companyName, setCompanyName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [billingEmail, setBillingEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/profile")
      return
    }
    void fetchMyAdvertiserAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]))
  }, [isAuthenticated, isLoading, router])

  const register = async () => {
    if (!companyName.trim() || !contactEmail.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      const created = await registerAdvertiserAccount({
        companyName: companyName.trim(),
        contactEmail: contactEmail.trim(),
        billingEmail: billingEmail.trim() || undefined,
      })
      setAccounts((prev) => [created, ...prev])
      setCompanyName("")
      setContactEmail("")
      setBillingEmail("")
      setMessage("Account created. An admin will verify your account before campaigns go live.")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-12 md:pl-20">
      <Header onSearchClick={() => {}} />
      <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Advertise on Prysym TV</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Register your business to run campaigns across home, shorts, movies, and verticals.
            Learn how advertising works on our{" "}
            <Link href="/advertise" className="text-primary hover:underline">
              Advertise page
            </Link>
            . Campaign creation is managed in{" "}
            <Link href="/admin/ads" className="text-primary hover:underline">
              admin
            </Link>{" "}
            after verification.
          </p>
        </div>

        {accounts.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">Your accounts</h2>
            <ul className="space-y-2">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="p-4 rounded-xl border border-border bg-secondary/20 text-sm"
                >
                  <p className="font-medium">{a.companyName}</p>
                  <p className="text-muted-foreground">{a.contactEmail}</p>
                  <p className="text-xs mt-1">
                    {a.isVerified ? "Verified" : "Pending verification"} ·{" "}
                    {a._count?.campaigns ?? 0} campaigns
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3 rounded-xl border border-border p-5">
          <h2 className="font-semibold">Register advertiser account</h2>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name"
            className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
          />
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="Contact email"
            type="email"
            className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
          />
          <input
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder="Billing email (optional)"
            type="email"
            className="w-full h-11 px-4 rounded-xl bg-secondary text-sm"
          />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button
            className="w-full rounded-full"
            disabled={busy || !companyName.trim() || !contactEmail.trim()}
            onClick={() => void register()}
          >
            Create account
          </Button>
        </section>
      </div>
      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
    </main>
  )
}
