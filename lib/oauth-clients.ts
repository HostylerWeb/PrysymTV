type GoogleCredentialHandler = (credential: string) => void

let googleScriptPromise: Promise<void> | null = null
let googleInitialized = false
let googleClientId: string | null = null
const googleHandlers = new Set<GoogleCredentialHandler>()

let appleScriptPromise: Promise<void> | null = null
let appleInitialized = false
let appleClientId: string | null = null

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void
        }
      }
    }
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope: string
          redirectURI: string
          usePopup: boolean
        }) => void
        signIn: () => Promise<{
          authorization: { id_token: string; code: string }
        }>
      }
    }
  }
}

function loadScript(src: string, id: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve()
  const existing = document.getElementById(id)
  if (existing) {
    return existing.getAttribute("data-loaded") === "true"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true })
          existing.addEventListener("error", () => reject(), { once: true })
        })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => {
      script.setAttribute("data-loaded", "true")
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${id}`))
    document.head.appendChild(script)
  })
}

export function loadGoogleScript(): Promise<void> {
  if (googleScriptPromise) return googleScriptPromise
  if (typeof window !== "undefined" && window.google?.accounts?.id) {
    googleScriptPromise = Promise.resolve()
    return googleScriptPromise
  }
  googleScriptPromise = loadScript(
    "https://accounts.google.com/gsi/client",
    "prysym-google-gsi",
  )
  return googleScriptPromise
}

export function subscribeGoogleCredential(
  handler: GoogleCredentialHandler,
): () => void {
  googleHandlers.add(handler)
  return () => googleHandlers.delete(handler)
}

function ensureGoogleInitialized(clientId: string): void {
  if (googleInitialized) return
  if (!window.google?.accounts?.id) {
    throw new Error("Google Sign-In is not available")
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        googleHandlers.forEach((handler) => handler(response.credential!))
      }
    },
  })
  googleClientId = clientId
  googleInitialized = true
}

export async function prepareGoogleSignIn(clientId: string): Promise<void> {
  await loadGoogleScript()
  if (!clientId) return
  if (googleClientId && googleClientId !== clientId) return
  ensureGoogleInitialized(clientId)
}

export function mountGoogleButton(container: HTMLElement, width: number): void {
  if (!window.google?.accounts?.id) return
  container.replaceChildren()
  window.google.accounts.id.renderButton(container, {
    theme: "filled_black",
    size: "large",
    shape: "pill",
    text: "continue_with",
    width,
    locale: "en",
  })
}

export function loadAppleScript(): Promise<void> {
  if (appleScriptPromise) return appleScriptPromise
  if (typeof window !== "undefined" && window.AppleID?.auth) {
    appleScriptPromise = Promise.resolve()
    return appleScriptPromise
  }
  appleScriptPromise = loadScript(
    "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
    "prysym-apple-auth",
  )
  return appleScriptPromise
}

function ensureAppleInitialized(clientId: string): void {
  if (appleInitialized) return
  if (!window.AppleID?.auth) {
    throw new Error("Apple Sign In is not available")
  }

  window.AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: window.location.origin,
    usePopup: true,
  })
  appleClientId = clientId
  appleInitialized = true
}

export async function prepareAppleSignIn(clientId: string): Promise<void> {
  await loadAppleScript()
  if (!clientId) return
  if (appleClientId && appleClientId !== clientId) return
  ensureAppleInitialized(clientId)
}

export async function signInWithApple(): Promise<{
  identityToken: string
  authorizationCode?: string
}> {
  if (!window.AppleID?.auth) {
    throw new Error("Apple Sign In is not available")
  }
  const response = await window.AppleID.auth.signIn()
  const identityToken = response.authorization.id_token
  if (!identityToken) {
    throw new Error("Apple did not return a sign-in token")
  }
  return {
    identityToken,
    authorizationCode: response.authorization.code,
  }
}
