"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOAuthConfig } from "@/contexts/oauth-config-context"
import {
  mountGoogleButton,
  prepareAppleSignIn,
  prepareGoogleSignIn,
  signInWithApple,
  subscribeGoogleCredential,
} from "@/lib/oauth-clients"
import {
  prepareFacebookSignIn,
  signInWithFacebook,
} from "@/lib/facebook-oauth"
import {
  canUseFacebookWebLogin,
  isPlaceholderFacebookAppId,
} from "@/lib/oauth-mock"

const envGoogleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
const envAppleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim()
const envFacebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim()

/** Match Google filled_black pill + auth modal submit (h-12, full width). */
const OAUTH_BUTTON_VISUAL =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[#747775] bg-[#131314] px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"

const OAUTH_BUTTON_INTERACTIVE =
  `${OAUTH_BUTTON_VISUAL} cursor-pointer hover:bg-[#1f1f1f] disabled:cursor-not-allowed`

type OAuthSignInButtonsProps = {
  disabled?: boolean
  onGoogleCredential: (idToken: string) => Promise<void>
  onAppleCredential: (
    identityToken: string,
    authorizationCode?: string,
  ) => Promise<void>
  onFacebookCredential: (accessToken: string) => Promise<void>
  onError?: (message: string) => void
  className?: string
}

function GoogleLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function AppleLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function FacebookLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" className={className} aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.024 4.388 11.015 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.088 24 18.097 24 12.073z" />
    </svg>
  )
}

function OAuthButtonFace({
  busy,
  icon,
  label,
}: {
  busy?: boolean
  icon: ReactNode
  label: string
}) {
  return (
    <div className={cn(OAUTH_BUTTON_VISUAL, "pointer-events-none group-hover:bg-[#1f1f1f]")}>
      {busy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </div>
  )
}

function GoogleSignInButton({
  disabled,
  busy,
  onSuccess,
  onError,
  clientId,
}: {
  disabled?: boolean
  busy?: boolean
  onSuccess: (credential: string) => void
  onError: () => void
  clientId: string | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonHostRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const next = Math.floor(el.getBoundingClientRect().width)
      if (next > 0) setWidth(next)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!clientId) return

    let cancelled = false
    void prepareGoogleSignIn(clientId)
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) onError()
      })

    return () => {
      cancelled = true
    }
  }, [clientId, onError])

  useEffect(() => {
    if (!clientId || !ready || !buttonHostRef.current || width <= 0) return
    if (disabled || busy) return
    mountGoogleButton(buttonHostRef.current, width)
  }, [clientId, ready, width, disabled, busy])

  useEffect(() => {
    if (!clientId || !ready) return
    return subscribeGoogleCredential(onSuccess)
  }, [clientId, ready, onSuccess])

  if (!clientId) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative h-12 w-full",
        (disabled || busy || !ready) && "opacity-50",
      )}
    >
      <OAuthButtonFace
        busy={busy || !ready}
        icon={<GoogleLogoIcon className="h-5 w-5 shrink-0" />}
        label="Continue with Google"
      />

      {!disabled && !busy && ready && width > 0 ? (
        <div
          ref={buttonHostRef}
          className="absolute inset-0 z-10 overflow-hidden opacity-[0.011]"
        />
      ) : null}
    </div>
  )
}

function AppleSignInButton({
  disabled,
  busy: externalBusy,
  onAppleCredential,
  onError,
  clientId,
}: Pick<
  OAuthSignInButtonsProps,
  "disabled" | "onAppleCredential" | "onError"
> & { busy?: boolean; clientId: string | null }) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!clientId) return

    let cancelled = false
    void prepareAppleSignIn(clientId)
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) onError?.("Failed to load Apple Sign In")
      })

    return () => {
      cancelled = true
    }
  }, [clientId, onError])

  const handleAppleSignIn = useCallback(async () => {
    setBusy(true)
    try {
      const { identityToken, authorizationCode } = await signInWithApple()
      await onAppleCredential(identityToken, authorizationCode)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Apple sign-in failed"
      if (!message.toLowerCase().includes("popup closed")) {
        onError?.(message)
      }
    } finally {
      setBusy(false)
    }
  }, [onAppleCredential, onError])

  if (!clientId) return null

  const isDisabled = disabled || busy || externalBusy || !ready

  return (
    <button
      type="button"
      className={OAUTH_BUTTON_INTERACTIVE}
      disabled={isDisabled}
      onClick={() => void handleAppleSignIn()}
    >
      {busy || externalBusy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <AppleLogoIcon className="h-5 w-5 shrink-0" />
          <span>Continue with Apple</span>
        </>
      )}
    </button>
  )
}

function FacebookSignInButton({
  disabled,
  busy: externalBusy,
  onFacebookCredential,
  onError,
  appId,
}: Pick<
  OAuthSignInButtonsProps,
  "disabled" | "onFacebookCredential" | "onError"
> & { busy?: boolean; appId: string | null }) {
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!appId) return
    if (isPlaceholderFacebookAppId(appId)) {
      setReady(true)
      return
    }

    let cancelled = false
    void prepareFacebookSignIn(appId)
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) onError?.("Failed to prepare Facebook Sign In")
      })

    return () => {
      cancelled = true
    }
  }, [appId, onError])

  const handleFacebookSignIn = useCallback(async () => {
    if (!appId) return

    if (isPlaceholderFacebookAppId(appId)) {
      onError?.(
        "Facebook sign-in is not configured yet. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to api/.env.",
      )
      return
    }

    if (!canUseFacebookWebLogin()) {
      onError?.(
        "Facebook sign-in requires HTTPS. Use the live site or run the web app over https://localhost.",
      )
      return
    }

    setBusy(true)
    try {
      const accessToken = await signInWithFacebook(appId)
      await onFacebookCredential(accessToken)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Facebook sign-in failed"
      if (!message.toLowerCase().includes("cancelled")) {
        onError?.(message)
      }
    } finally {
      setBusy(false)
    }
  }, [appId, onFacebookCredential, onError])

  if (!appId) return null

  const isDisabled = disabled || busy || externalBusy || !ready

  return (
    <button
      type="button"
      className={OAUTH_BUTTON_INTERACTIVE}
      disabled={isDisabled}
      onClick={() => void handleFacebookSignIn()}
    >
      {busy || externalBusy ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <FacebookLogoIcon className="h-5 w-5 shrink-0" />
          <span>Continue with Facebook</span>
        </>
      )}
    </button>
  )
}

export function OAuthSignInButtons({
  disabled,
  onGoogleCredential,
  onAppleCredential,
  onFacebookCredential,
  onError,
  className,
}: OAuthSignInButtonsProps) {
  const { googleWebClientId, appleWebClientId, facebookAppId } = useOAuthConfig()
  const googleClientId = googleWebClientId ?? envGoogleClientId ?? null
  const appleClientId = appleWebClientId ?? envAppleClientId ?? null
  const facebookId = facebookAppId ?? envFacebookAppId ?? null
  const [googleBusy, setGoogleBusy] = useState(false)

  const handleGoogleSuccess = useCallback(
    async (credential: string) => {
      setGoogleBusy(true)
      try {
        await onGoogleCredential(credential)
      } catch (err) {
        onError?.(
          err instanceof Error ? err.message : "Google sign-in failed",
        )
      } finally {
        setGoogleBusy(false)
      }
    },
    [onGoogleCredential, onError],
  )

  if (!googleClientId && !appleClientId && !facebookId) return null

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {googleClientId ? (
          <GoogleSignInButton
            clientId={googleClientId}
            disabled={disabled}
            busy={googleBusy}
            onSuccess={(credential) => void handleGoogleSuccess(credential)}
            onError={() => onError?.("Google sign-in failed")}
          />
        ) : null}

        {appleClientId ? (
          <AppleSignInButton
            clientId={appleClientId}
            disabled={disabled}
            busy={googleBusy}
            onAppleCredential={onAppleCredential}
            onError={onError}
          />
        ) : null}

        {facebookId ? (
          <FacebookSignInButton
            appId={facebookId}
            disabled={disabled}
            busy={googleBusy}
            onFacebookCredential={onFacebookCredential}
            onError={onError}
          />
        ) : null}
      </div>
    </div>
  )
}

export function isOAuthConfigured(): boolean {
  return Boolean(envGoogleClientId || envAppleClientId || envFacebookAppId)
}

export function useOAuthButtonsAvailable(): boolean {
  const { isOAuthAvailable } = useOAuthConfig()
  return isOAuthAvailable || isOAuthConfigured()
}
