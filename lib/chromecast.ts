export type CastableMedia = {
  title: string
  subtitle?: string
  streamUrl: string
  posterUrl?: string
  currentTime?: number
  /** Use LIVE stream type for live HLS (e.g. broadcasts). */
  isLive?: boolean
}

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

export async function castMedia(media: CastableMedia): Promise<void> {
  const url = toAbsoluteCastUrl(media.streamUrl ?? "")
  if (!url) throw new Error("No stream URL to cast")

  await loadCastSdk()
  const context = window.cast!.framework.CastContext.getInstance()
  let session = context.getCurrentSession()
  if (!session) {
    session = await context.requestSession()
  }

  const contentType = inferCastContentType(url)
  const mediaInfo = new chrome.cast.media.MediaInfo(url, contentType)
  mediaInfo.streamType =
    media.isLive || url.includes("/live/")
      ? chrome.cast.media.StreamType.LIVE
      : chrome.cast.media.StreamType.BUFFERED

  const metadata = new chrome.cast.media.GenericMediaMetadata()
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
  if (media.currentTime != null && media.currentTime > 0) {
    request.currentTime = media.currentTime
  }

  await new Promise<void>((resolve, reject) => {
    session!.loadMedia(
      request,
      () => resolve(),
      (err) => reject(err ?? new Error("Failed to load media on Cast device")),
    )
  })
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
