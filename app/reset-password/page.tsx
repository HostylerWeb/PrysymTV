"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resetPassword } from "@/lib/api/auth"
import { getAuthErrorMessage } from "@/contexts/auth-context"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Invalid or missing reset link. Request a new email from the sign-in screen.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Invalid reset link</h1>
          <p className="text-muted-foreground text-sm">
            This link is missing or expired. Open the app and use Forgot password to get a new email.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Back to Prysym TV</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="text-muted-foreground text-sm">
            You can sign in with your new password.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Go to home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full space-y-4 rounded-2xl border border-border p-6"
      >
        <h1 className="text-2xl font-bold text-center">Set a new password</h1>
        <p className="text-sm text-muted-foreground text-center">
          Choose a password for your Prysym TV account.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive text-center">{error}</p>
          </div>
        )}

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            minLength={8}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            minLength={8}
            required
          />
        </div>

        <Button type="submit" className="w-full h-12" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update password"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary font-medium">
            Back to home
          </Link>
        </p>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
