"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  Film,
  LayoutGrid,
  Megaphone,
  ShieldCheck,
  Smartphone,
  Tv,
} from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BottomNavigation } from "@/components/bottom-navigation"
import { SearchModal } from "@/components/search-modal"
import { AdvertiserRegisterModal } from "@/components/advertiser-register-modal"
import { Button } from "@/components/ui/button"
import { LEGAL_CONTACT, PLATFORM_NAME } from "@/lib/legal/company"
import { useAuth } from "@/contexts/auth-context"
import {
  fetchMyAdvertiserAccounts,
  type AdvertiserAccount,
} from "@/lib/api/advertisers"
import { profileAuthHref } from "@/lib/safe-return-path"
import { cn } from "@/lib/utils"

const PLACEMENTS = [
  {
    icon: LayoutGrid,
    title: "Home banner",
    description:
      "High-visibility sponsored banner on the home feed — ideal for brand awareness and product launches.",
  },
  {
    icon: Smartphone,
    title: "Shorts interstitial",
    description:
      "Full-screen video or image ads between Shorts swipes. Skippable after a configurable countdown.",
  },
  {
    icon: Film,
    title: "Movie preroll",
    description:
      "Pre-roll video before long-form movies. Reach viewers in a lean-back, high-attention context.",
  },
  {
    icon: Tv,
    title: "Vertical episode gate",
    description:
      "Sponsored moment before the next episode in vertical micro-drama series — built for serialized storytelling.",
  },
] as const

const STEPS = [
  {
    step: "1",
    title: "Register your business",
    body: "Create an advertiser account with your company name and contact details.",
  },
  {
    step: "2",
    title: "Get verified",
    body: "Our team reviews your account to protect viewers and maintain brand safety on the platform.",
  },
  {
    step: "3",
    title: "Launch campaigns",
    body: "Work with Prysym TV to set budget, placement, creative, click-through URL, and targeting goals.",
  },
  {
    step: "4",
    title: "Measure results",
    body: "Track impressions, clicks, CTR, and spend. Pay based on agreed CPM or package terms.",
  },
] as const

function AdvertiserAccountStatus({
  account,
  onOpenPortal,
}: {
  account: AdvertiserAccount
  onOpenPortal: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpenPortal}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-colors hover:bg-secondary/40",
        account.isVerified
          ? "border-green-500/30 bg-green-500/5"
          : "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{account.companyName}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{account.contactEmail}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            account.isVerified
              ? "bg-green-500/15 text-green-600 dark:text-green-400"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          )}
        >
          {account.isVerified ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Verified
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              Pending
            </>
          )}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {account.isVerified ? (
          <>
            {account._count?.campaigns ?? 0} active campaign
            {(account._count?.campaigns ?? 0) === 1 ? "" : "s"} · View details
          </>
        ) : (
          <>Under review · Cancel or update details</>
        )}
      </p>
    </button>
  )
}

export default function AdvertisePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [accounts, setAccounts] = useState<AdvertiserAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)

  const registerReturn = "/advertise?register=1"

  const openRegisterModal = useCallback(() => {
    if (!isAuthenticated) {
      router.push(profileAuthHref(registerReturn, "register"))
      return
    }
    setIsRegisterOpen(true)
  }, [isAuthenticated, router, registerReturn])

  const closeRegisterModal = useCallback(() => {
    setIsRegisterOpen(false)
    if (searchParams.get("register") === "1") {
      router.replace("/advertise")
    }
  }, [router, searchParams])

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      setAccounts([])
      return
    }
    setAccountsLoading(true)
    void fetchMyAdvertiserAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false))
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    if (searchParams.get("register") === "1") {
      setIsRegisterOpen(true)
    }
  }, [isAuthenticated, isLoading, searchParams])

  const pendingAccount = accounts.find((a) => !a.isVerified) ?? null
  const hasPending = pendingAccount !== null
  const verifiedCount = accounts.filter((a) => a.isVerified).length

  const registerButtonLabel = hasPending
    ? "View pending request"
    : verifiedCount > 0
      ? "Register another business"
      : "Register advertiser account"

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0 md:pl-20">
      <Header onSearchClick={() => setIsSearchOpen(true)} />

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="flex items-center gap-2 text-primary mb-4">
          <Megaphone className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">For advertisers</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4">
          Advertise on {PLATFORM_NAME}
        </h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
          Reach engaged viewers across video, Shorts, movies, live streams, and vertical series.
          {PLATFORM_NAME} offers brand-safe placements with transparent reporting and verified
          advertiser accounts.
        </p>

        {!isLoading && isAuthenticated && (
          <div className="rounded-xl border border-border/80 bg-card/40 p-4 md:p-5 mb-8 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4 text-primary" />
              <span>
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {user?.name || user?.username}
                </span>
              </span>
            </div>
            {accountsLoading ? (
              <p className="text-sm text-muted-foreground">Loading your advertiser accounts…</p>
            ) : accounts.length > 0 ? (
              <div className="space-y-2">
                {accounts.map((a) => (
                  <AdvertiserAccountStatus
                    key={a.id}
                    account={a}
                    onOpenPortal={() => setIsRegisterOpen(true)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No advertiser account linked yet. Register your business to start verification.
              </p>
            )}
          </div>
        )}

        {!isLoading && !isAuthenticated && (
          <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-8 max-w-2xl">
            Sign in or create an account to register as an advertiser. You&apos;ll return here
            after logging in.
          </p>
        )}

        <div className="flex flex-wrap gap-3 mb-16">
          {isAuthenticated ? (
            <Button className="rounded-full" onClick={openRegisterModal}>
              {registerButtonLabel}
            </Button>
          ) : (
            <>
              <Button asChild className="rounded-full">
                <Link href={profileAuthHref(registerReturn, "register")}>Register advertiser account</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link href={profileAuthHref("/advertise", "login")}>Sign in</Link>
              </Button>
            </>
          )}
          <Button asChild variant={isAuthenticated ? "secondary" : "outline"} className="rounded-full">
            <a href={`mailto:${LEGAL_CONTACT.ads}`}>Contact sales</a>
          </Button>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">How it works</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-border bg-card/40 p-5"
              >
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold mb-3">
                  {item.step}
                </span>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ad placements</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Campaigns are assigned to one or more placements. Prysym Membership subscribers may not
            see ads on eligible placements.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLACEMENTS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border p-5 flex gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Pricing &amp; reporting</h2>
          <div className="rounded-xl border border-border p-6 space-y-4">
            <div className="flex gap-3">
              <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">CPM and budget controls</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Campaigns run against a defined budget and cost-per-thousand-impressions (CPM).
                  Delivery stops when the budget is exhausted or the campaign end date is reached.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Brand safety</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All advertiser accounts are verified before campaigns go live. Creative must comply
                  with our{" "}
                  <Link href="/guidelines" className="text-primary hover:underline">
                    Community Guidelines
                  </Link>{" "}
                  and applicable U.S. advertising laws. Prohibited categories include illegal
                  products, deceptive claims, hate speech, and adult content.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">Creative requirements</h2>
          <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
            <li>Image or video assets supplied in formats accepted by the upload system.</li>
            <li>A valid HTTPS click-through URL (opens in a new tab for viewers).</li>
            <li>Clear &quot;Sponsored&quot; labeling on all placements — handled by the Platform UI.</li>
            <li>No auto-playing audio on banner placements; video placements may be muted by default.</li>
            <li>Accurate representation of the advertised product or service.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isAuthenticated
              ? hasPending
                ? "Your registration is under review. Open the modal to cancel and resubmit if you need to change your details."
                : "Register a business or check your verification status."
              : "Sign in first, then register your advertiser account to begin verification."}{" "}
            For enterprise packages, custom integrations, or media kits, email{" "}
            <a href={`mailto:${LEGAL_CONTACT.ads}`} className="text-primary hover:underline">
              {LEGAL_CONTACT.ads}
            </a>
            .
          </p>
          {isAuthenticated ? (
            <Button className="rounded-full" onClick={openRegisterModal}>
              {registerButtonLabel}
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link href={profileAuthHref(registerReturn, "register")}>Sign in to get started</Link>
            </Button>
          )}
        </section>

        <p className="mt-10 text-xs text-muted-foreground">
          Advertising on {PLATFORM_NAME} is subject to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <Footer />
      <BottomNavigation activeTab="none" onTabChange={() => {}} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AdvertiserRegisterModal
        isOpen={isRegisterOpen}
        onClose={closeRegisterModal}
        accounts={accounts}
        onAccountsChange={setAccounts}
      />
    </main>
  )
}
