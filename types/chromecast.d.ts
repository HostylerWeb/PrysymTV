/** Minimal Google Cast sender SDK types for web casting. */
declare namespace chrome.cast {
  enum AutoJoinPolicy {
    ORIGIN_SCOPED = "origin_scoped",
  }

  type ErrorCode = string

  class Image {
    constructor(url: string)
    url: string
    height?: number
    width?: number
  }

  namespace media {
    const DEFAULT_MEDIA_RECEIVER_APP_ID: string

    enum StreamType {
      BUFFERED = "BUFFERED",
      LIVE = "LIVE",
    }

    enum MetadataType {
      GENERIC = 0,
      MOVIE = 1,
      TV_SHOW = 2,
      MUSIC_TRACK = 3,
    }

    class GenericMediaMetadata {
      metadataType?: MetadataType
      title?: string
      subtitle?: string
      images?: chrome.cast.Image[]
    }

    class MediaInfo {
      constructor(contentId: string, contentType: string)
      contentId: string
      contentType: string
      streamType: StreamType
      metadata?: GenericMediaMetadata
    }

    class LoadRequest {
      constructor(media: MediaInfo)
      autoplay?: boolean
      currentTime?: number
    }
  }
}

declare namespace cast {
  namespace framework {
    enum CastState {
      NO_DEVICES_AVAILABLE = "no_devices_available",
      NOT_CONNECTED = "not_connected",
      CONNECTING = "connecting",
      CONNECTED = "connected",
    }

    enum SessionState {
      SESSION_STARTED = "SESSION_STARTED",
      SESSION_ENDED = "SESSION_ENDED",
      SESSION_STARTING = "SESSION_STARTING",
      SESSION_START_FAILED = "SESSION_START_FAILED",
      SESSION_RESUMED = "SESSION_RESUMED",
      SESSION_ENDING = "SESSION_ENDING",
    }

    class CastSession {
      loadMedia(
        loadRequest: chrome.cast.media.LoadRequest,
      ): Promise<chrome.cast.ErrorCode | null | void>
    }

    class CastContext {
      static getInstance(): CastContext
      setOptions(options: {
        receiverApplicationId: string
        autoJoinPolicy: chrome.cast.AutoJoinPolicy
      }): void
      getCastState(): CastState
      getSessionState(): SessionState
      /** Opens device picker; resolves when session starts (not with a session object). */
      requestSession(): Promise<chrome.cast.ErrorCode | null | void>
      getCurrentSession(): CastSession | null
      addEventListener(
        type: string,
        handler: (event: {
          castState?: CastState
          sessionState?: SessionState
        }) => void,
      ): void
      removeEventListener(
        type: string,
        handler: (event: {
          castState?: CastState
          sessionState?: SessionState
        }) => void,
      ): void
    }

    const CastContextEventType: {
      CAST_STATE_CHANGED: string
      SESSION_STATE_CHANGED: string
    }
  }
}

interface Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void
  cast?: typeof cast
}
