const FACEBOOK_OAUTH_VERSION = "v21.0"
const FACEBOOK_SCOPES = "public_profile,email"
const POPUP_NAME = "prysym_facebook_oauth"

export function getFacebookRedirectUri(): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/auth/facebook-callback`
}

function buildFacebookOAuthUrl(appId: string): string {
  const url = new URL(
    `https://www.facebook.com/${FACEBOOK_OAUTH_VERSION}/dialog/oauth`,
  )
  url.searchParams.set("client_id", appId)
  url.searchParams.set("redirect_uri", getFacebookRedirectUri())
  url.searchParams.set("response_type", "token")
  url.searchParams.set("scope", FACEBOOK_SCOPES)
  url.searchParams.set("display", "popup")
  return url.toString()
}

/** No SDK to load — redirect flow only needs the public app ID. */
export async function prepareFacebookSignIn(appId: string): Promise<void> {
  if (!appId?.trim()) {
    throw new Error("Facebook sign-in is not configured")
  }
}

export async function signInWithFacebook(appId: string): Promise<string> {
  if (!appId?.trim()) {
    throw new Error("Facebook sign-in is not configured")
  }

  if (typeof window === "undefined") {
    throw new Error("Facebook Sign-In is not available")
  }

  if (window.location.protocol !== "https:") {
    throw new Error(
      "Facebook sign-in requires HTTPS. Open the site over https:// or test on the live deployment.",
    )
  }

  const popupUrl = buildFacebookOAuthUrl(appId)
  const width = 560
  const height = 720
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",")

  return new Promise((resolve, reject) => {
    const popup = window.open(popupUrl, POPUP_NAME, features)
    if (!popup) {
      reject(
        new Error(
          "Popup blocked. Allow popups for this site and try Facebook sign-in again.",
        ),
      )
      return
    }

    let settled = false

    const cleanup = () => {
      window.removeEventListener("message", onMessage)
      window.clearInterval(closePoll)
    }

    const finish = (handler: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      handler()
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as {
        type?: string
        accessToken?: string
        error?: string
      }
      if (data.type !== "facebook-oauth-token") return

      try {
        popup.close()
      } catch {
        /* ignore */
      }

      if (data.accessToken) {
        finish(() => resolve(data.accessToken))
        return
      }

      finish(() =>
        reject(
          new Error(data.error ?? "Facebook sign-in was cancelled"),
        ),
      )
    }

    const closePoll = window.setInterval(() => {
      if (!popup.closed) return
      finish(() => reject(new Error("Facebook sign-in was cancelled")))
    }, 400)

    window.addEventListener("message", onMessage)
  })
}
