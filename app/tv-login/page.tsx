"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2, Tv } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { approveTvLogin } from "@/lib/api/tv-auth"
import { ApiError } from "@/lib/api-client"

type Status = "loading" | "need_auth" | "approving" | "success" | "error"

function TvLoginContent() {
  const searchParams = useSearchParams()
  const codeParam = searchParams.get("code")?.trim() ?? ""
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [status, setStatus] = useState<Status>("loading")
  const [error, setError] = useState("")
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!codeParam) {
      setStatus("error")
      setError("Missing TV sign-in code. Scan the QR code on your TV again.")
      return
    }

    if (!isAuthenticated) {
      setStatus("need_auth")
      setAuthOpen(true)
      return
    }

    let cancelled = false
    setStatus("approving")
    setError("")

    void approveTvLogin(codeParam)
      .then(() => {
        if (!cancelled) setStatus("success")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStatus("error")
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError("Could not connect your TV. The code may have expired — try again on your TV.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, codeParam, isAuthenticated])

  const displayCode =
    codeParam.replace(/-/g, "").length === 8
      ? `${codeParam.replace(/-/g, "").slice(0, 4)}-${codeParam.replace(/-/g, "").slice(4)}`
      : codeParam

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Tv className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">Sign in on your TV</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm this code matches what&apos;s shown on your TV screen.
        </p>

        {displayCode ? (
          <p className="mt-6 text-3xl font-extrabold tracking-[0.2em] text-foreground">
            {displayCode}
          </p>
        ) : null}

        {status === "loading" || status === "approving" || authLoading ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">
              {status === "approving" ? "Connecting your TV…" : "Loading…"}
            </p>
          </div>
        ) : null}

        {status === "need_auth" ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Sign in below to approve this TV device.
          </p>
        ) : null}

        {status === "success" ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-semibold text-foreground">You&apos;re all set!</p>
            <p className="text-sm text-muted-foreground">
              Your TV should sign in automatically. You can close this page.
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            {isAuthenticated && codeParam ? (
              <Button
                onClick={() => {
                  setStatus("approving")
                  setError("")
                  void approveTvLogin(codeParam)
                    .then(() => setStatus("success"))
                    .catch((err: unknown) => {
                      setStatus("error")
                      setError(
                        err instanceof ApiError
                          ? err.message
                          : "Could not connect your TV. Try a new code on your TV.",
                      )
                    })
                }}
              >
                Try again
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="login"
        onSuccess={() => {
          setAuthOpen(false)
          if (!codeParam) return
          setStatus("approving")
          setError("")
          void approveTvLogin(codeParam)
            .then(() => setStatus("success"))
            .catch((err: unknown) => {
              setStatus("error")
              setError(
                err instanceof ApiError
                  ? err.message
                  : "Could not connect your TV. Try a new code on your TV.",
              )
            })
        }}
      />
    </div>
  )
}

export default function TvLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TvLoginContent />
    </Suspense>
  )
}
