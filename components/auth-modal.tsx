"use client"

import { useEffect, useState } from "react"
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth, getAuthErrorMessage } from "@/contexts/auth-context"
import { forgotPassword } from "@/lib/api/auth"
import {
  OAuthSignInButtons,
} from "@/components/oauth-sign-in-buttons"
import { useOAuthConfig } from "@/contexts/oauth-config-context"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: "login" | "register"
  onSuccess?: () => void
}

type AuthMode = "login" | "register" | "forgot_email" | "forgot_sent"

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const { login, register, loginWithGoogle, loginWithApple } = useAuth()
  const { isOAuthAvailable } = useOAuthConfig()

  useEffect(() => {
    if (!isOpen) return
    setMode(initialMode)
    setError("")
  }, [isOpen, initialMode])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (mode === "login") {
        if (!email || !password) {
          setError("Please fill in all fields")
          return
        }
        await login(email, password)
        onClose()
        resetForm()
        onSuccess?.()
      } else if (mode === "register") {
        if (!name || !email || !password) {
          setError("Please fill in all fields")
          return
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters")
          return
        }
        await register(name, email, password)
        onClose()
        resetForm()
        onSuccess?.()
      } else if (mode === "forgot_email") {
        if (!email) {
          setError("Please enter your email")
          return
        }
        await forgotPassword(email)
        setMode("forgot_sent")
      }
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setError("")
    setMode(initialMode)
  }

  const title =
    mode === "login"
      ? "Welcome Back"
      : mode === "register"
        ? "Create Account"
        : mode === "forgot_email"
          ? "Reset Password"
          : "Check your email"

  const subtitle =
    mode === "login"
      ? "Sign in to continue to Prysym TV"
      : mode === "register"
        ? "Join Prysym TV and start watching"
        : mode === "forgot_email"
          ? "We will email you a link to reset your password"
          : "If an account exists for that address, we sent a reset link. It expires in 15 minutes."

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            type="button"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎬</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {mode === "forgot_sent" ? (
          <div className="px-6 pb-8 space-y-4">
            <Button
              type="button"
              className="w-full h-12 rounded-xl"
              onClick={() => {
                setMode("login")
                setError("")
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {(mode === "login" || mode === "register" || mode === "forgot_email") && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {(mode === "login" || mode === "register") && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full h-12 pl-12 pr-12 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot_email")
                  setError("")
                }}
                className="text-sm text-primary font-medium w-full text-right"
              >
                Forgot password?
              </button>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "register" ? (
                "Create Account"
              ) : (
                "Send reset link"
              )}
            </Button>

            {(mode === "login" || mode === "register") && isOAuthAvailable ? (
              <OAuthSignInButtons
                disabled={isLoading}
                onGoogleCredential={async (idToken) => {
                  setError("")
                  setIsLoading(true)
                  try {
                    await loginWithGoogle(idToken)
                    onClose()
                    resetForm()
                    onSuccess?.()
                  } catch (err) {
                    setError(getAuthErrorMessage(err))
                  } finally {
                    setIsLoading(false)
                  }
                }}
                onAppleCredential={async (identityToken, authorizationCode) => {
                  setError("")
                  setIsLoading(true)
                  try {
                    await loginWithApple(identityToken, authorizationCode)
                    onClose()
                    resetForm()
                    onSuccess?.()
                  } catch (err) {
                    setError(getAuthErrorMessage(err))
                  } finally {
                    setIsLoading(false)
                  }
                }}
                onError={(message) => setError(message)}
              />
            ) : null}

            {(mode === "login" || mode === "register") && (
              <p className="text-center text-sm text-muted-foreground pt-4">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login")
                    setError("")
                  }}
                  className="text-primary font-semibold"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            )}

            {mode === "forgot_email" && (
              <p className="text-center text-sm text-muted-foreground pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login")
                    setError("")
                  }}
                  className="text-primary font-semibold"
                >
                  Back to sign in
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
