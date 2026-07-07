import { getApiBaseUrl } from "@/lib/api-client"

export type CastableMedia = {
  title: string
  subtitle?: string
  streamUrl: string
  posterUrl?: string
  currentTime?: number
  /** Use LIVE stream type for live HLS (e.g. broadcasts). */
  isLive?: boolean
}

/** Public CDNs that already send CORS headers for Chromecast receivers. */
const CAST_DIRECT_ORIGINS = new Set([
  "https://commondatastorage.googleapis.com",
])

export function toAbsoluteCastUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (typeof window === "undefined") return trimmed
  return new URL(trimmed, window.location.origin).href
}

export function inferCastContentType(url: string): string {
  const path = url.split("?")[0]?.toLowerCase() ?? ""
  if (path.endsWith(".m3u8")) return "application/x-mpegURL"
  if (path.endsWith(".mp4")) return "video/mp4"
  if (path.endsWith(".webm")) return "video/webm"
  if (path.endsWith(".mp3")) return "audio/mpeg"
  if (path.endsWith(".m4a") || path.endsWith(".aac")) return "audio/mp4"
  return "application/x-mpegURL"
}

function needsCastProxy(url: string): boolean {
  try {
    const parsed = new URL(url)
    const apiBase = getApiBaseUrl()
    if (url.startsWith(`${apiBase}/playback/`)) return false
    return !CAST_DIRECT_ORIGINS.has(parsed.origin)
  } catch {
    return true
  }
}

/** Route media through the API cast proxy so the receiver gets CORS-safe URLs. */
export function resolveCastStreamUrl(streamUrl: string): string {
  const absolute = toAbsoluteCastUrl(streamUrl)
  if (!absolute || !needsCastProxy(absolute)) return absolute

  if (typeof window === "undefined") return absolute

  try {
    const apiBase = getApiBaseUrl()
    return `${apiBase}/cast/proxy?url=${encodeURIComponent(absolute)}`
  } catch {
    return absolute
  }
}

function castErrorMessage(code: unknown): string {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_")

  switch (normalized) {
    case "LOAD_FAILED":
      return "The TV could not load this video. Try again or use a different video."
    case "LOAD_CANCELLED":
      return "Cast was cancelled."
    case "INVALID_REQUEST":
      return "This video cannot be cast in its current format."
    case "SESSION_ERROR":
      return "Lost connection to the Cast device."
    case "TIMEOUT":
      return "Timed out connecting to the Cast device."
    default:
      if (normalized) return `Cast error: ${normalized}`
      return "Failed to load media on Cast device"
  }
}

let sdkLoadPromise: Promise<void> | null = null
let sdkInitialized = false

function initCastContext() {
  if (sdkInitialized || typeof window === "undefined" || !window.cast?.framework) return
  const context = window.cast.framework.CastContext.getInstance()
  context.setOptions({
    receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  })
  sdkInitialized = true
}

export function loadCastSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cast is only available in the browser"))
  }
  if (window.cast?.framework) {
    initCastContext()
    return Promise.resolve()
  }
  if (sdkLoadPromise) return sdkLoadPromise

  sdkLoadPromise = new Promise((resolve, reject) => {
    window.__onGCastApiAvailable = (isAvailable) => {
      if (!isAvailable) {
        reject(new Error("Google Cast is not available in this browser"))
        return
      }
      try {
        initCastContext()
        resolve()
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to initialize Cast"))
      }
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="cast_sender.js"]',
    )
    if (existing) {
      const waitForFramework = () => {
        if (window.cast?.framework) {
          try {
            initCastContext()
            resolve()
          } catch (err) {
            reject(err instanceof Error ? err : new Error("Failed to initialize Cast"))
          }
          return
        }
        window.setTimeout(waitForFramework, 100)
      }
      waitForFramework()
      return
    }

    const script = document.createElement("script")
    script.src =
      "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
    script.async = true
    script.onerror = () => reject(new Error("Failed to load Google Cast SDK"))
    document.head.appendChild(script)
  })

  return sdkLoadPromise
}

export function getCastState(): cast.framework.CastState | "unavailable" {
  if (typeof window === "undefined" || !window.cast?.framework) return "unavailable"
  return window.cast.framework.CastContext.getInstance().getCastState()
}

async function ensureCastSession(): Promise<cast.framework.CastSession> {
  await loadCastSdk()
  const context = window.cast!.framework.CastContext.getInstance()

  const existing = context.getCurrentSession()
  if (existing) return existing

  const { CastContextEventType, SessionState } = window.cast!.framework

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error("Timed out connecting to Cast device"))
    }, 60_000)

    const onSessionState = (event: { sessionState?: cast.framework.SessionState }) => {
      if (
        event.sessionState === SessionState.SESSION_STARTED ||
        event.sessionState === SessionState.SESSION_RESUMED
      ) {
        const session = context.getCurrentSession()
        if (session) {
          cleanup()
          resolve(session)
        }
        return
      }
      if (event.sessionState === SessionState.SESSION_START_FAILED) {
        cleanup()
        reject(new Error("Could not connect to Cast device"))
      }
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      context.removeEventListener(CastContextEventType.SESSION_STATE_CHANGED, onSessionState)
    }

    context.addEventListener(CastContextEventType.SESSION_STATE_CHANGED, onSessionState)

    void context
      .requestSession()
      .then(() => {
        const session = context.getCurrentSession()
        if (session) {
          cleanup()
          resolve(session)
        }
      })
      .catch(() => {
        cleanup()
        reject(new Error("Cast was cancelled or no device was selected"))
      })
  })
}

export async function castMedia(media: CastableMedia): Promise<void> {
  const url = resolveCastStreamUrl(media.streamUrl ?? "")
  if (!url) throw new Error("No stream URL to cast")

  const castSession = await ensureCastSession()

  const contentType = inferCastContentType(url)
  const mediaInfo = new chrome.cast.media.MediaInfo(url, contentType)
  mediaInfo.contentId = url
  mediaInfo.streamType =
    media.isLive || media.streamUrl.includes("/live/")
      ? chrome.cast.media.StreamType.LIVE
      : chrome.cast.media.StreamType.BUFFERED

  const metadata = new chrome.cast.media.GenericMediaMetadata()
  metadata.metadataType = chrome.cast.media.MetadataType.GENERIC
  metadata.title = media.title
  if (media.subtitle) metadata.subtitle = media.subtitle
  const poster = media.posterUrl?.trim()
  if (poster) {
    const posterUrl = toAbsoluteCastUrl(poster)
    metadata.images =
      typeof chrome.cast.Image === "function"
        ? [new chrome.cast.Image(posterUrl)]
        : [{ url: posterUrl }]
  }
  mediaInfo.metadata = metadata

  const request = new chrome.cast.media.LoadRequest(mediaInfo)
  request.autoplay = true
  if (media.currentTime != null && media.currentTime > 0) {
    request.currentTime = media.currentTime
  }

  try {
    const errorCode = await castSession.loadMedia(request)
    if (errorCode != null && errorCode !== "") {
      throw new Error(castErrorMessage(errorCode))
    }
  } catch (err) {
    if (err instanceof Error) throw err
    throw new Error(castErrorMessage(err))
  }
}

export function subscribeCastState(
  handler: (state: cast.framework.CastState | "unavailable") => void,
): () => void {
  if (typeof window === "undefined" || !window.cast?.framework) {
    handler("unavailable")
    return () => {}
  }

  const context = window.cast.framework.CastContext.getInstance()
  const listener = () => handler(context.getCastState())
  const eventType = window.cast.framework.CastContextEventType.CAST_STATE_CHANGED
  context.addEventListener(eventType, listener)
  handler(context.getCastState())

  return () => {
    context.removeEventListener(eventType, listener)
  }
}
