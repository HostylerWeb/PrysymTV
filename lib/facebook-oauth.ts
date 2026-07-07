let facebookScriptPromise: Promise<void> | null = null
let facebookInitialized = false
let facebookAppId: string | null = null

declare global {
  interface Window {
    FB?: {
      init: (config: {
        appId: string
        cookie?: boolean
        xfbml?: boolean
        version: string
      }) => void
      login: (
        callback: (response: {
          authResponse?: { accessToken?: string }
          status?: string
        }) => void,
        options?: { scope?: string },
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

function loadFacebookSdk(): Promise<void> {
  if (facebookScriptPromise) return facebookScriptPromise
  if (typeof window !== "undefined" && window.FB) {
    facebookScriptPromise = Promise.resolve()
    return facebookScriptPromise
  }
  if (typeof document === "undefined") return Promise.resolve()

  facebookScriptPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => resolve()

    const existing = document.getElementById("prysym-facebook-jssdk")
    if (existing) {
      if (window.FB) {
        resolve()
        return
      }
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(), { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = "prysym-facebook-jssdk"
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error("Failed to load Facebook SDK"))
    document.head.appendChild(script)
  })

  return facebookScriptPromise
}

function ensureFacebookInitialized(appId: string): void {
  if (!window.FB) {
    throw new Error("Facebook Sign-In is not available")
  }
  if (facebookInitialized && facebookAppId === appId) return

  window.FB.init({
    appId,
    cookie: true,
    xfbml: false,
    version: "v21.0",
  })
  facebookAppId = appId
  facebookInitialized = true
}

export async function prepareFacebookSignIn(appId: string): Promise<void> {
  await loadFacebookSdk()
  if (!appId) return
  if (facebookAppId && facebookAppId !== appId) return
  ensureFacebookInitialized(appId)
}

export async function signInWithFacebook(): Promise<string> {
  await loadFacebookSdk()
  if (!window.FB) {
    throw new Error("Facebook Sign-In is not available")
  }

  return new Promise((resolve, reject) => {
    window.FB!.login(
      (response) => {
        const accessToken = response.authResponse?.accessToken
        if (accessToken) {
          resolve(accessToken)
          return
        }
        reject(new Error("Facebook sign-in was cancelled"))
      },
      { scope: "public_profile,email" },
    )
  })
}
