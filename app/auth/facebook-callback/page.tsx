"use client"

import { useEffect } from "react"

function postToOpener(payload: {
  type: "facebook-oauth-token"
  accessToken?: string
  error?: string
}) {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(payload, window.location.origin)
  }
}

export default function FacebookCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.search.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get("access_token")
    const error =
      params.get("error_description") ??
      params.get("error_reason") ??
      params.get("error") ??
      undefined

    if (accessToken) {
      postToOpener({ type: "facebook-oauth-token", accessToken })
    } else {
      postToOpener({
        type: "facebook-oauth-token",
        error: error ?? "Facebook sign-in was cancelled",
      })
    }

    window.setTimeout(() => window.close(), 100)
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
      Completing Facebook sign-in…
    </main>
  )
}
