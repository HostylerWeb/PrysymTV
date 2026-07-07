/** Minimal Google Cast sender SDK types for web casting. */
declare namespace chrome.cast {
  enum AutoJoinPolicy {
    ORIGIN_SCOPED = "origin_scoped",
  }

  namespace media {
    const DEFAULT_MEDIA_RECEIVER_APP_ID: string

    enum StreamType {
      BUFFERED = "BUFFERED",
      LIVE = "LIVE",
    }

    class Image {
      constructor(url: string)
      url: string
    }

    class GenericMediaMetadata {
      title?: string
      subtitle?: string
      images?: Image[]
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
      currentTime?: number
    }
  }

  class Session {
    loadMedia(
      loadRequest: media.LoadRequest,
      onSuccess: () => void,
      onError: (error: Error) => void,
    ): void
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

    class CastContext {
      static getInstance(): CastContext
      setOptions(options: {
        receiverApplicationId: string
        autoJoinPolicy: chrome.cast.AutoJoinPolicy
      }): void
      getCastState(): CastState
      requestSession(): Promise<chrome.cast.Session>
      getCurrentSession(): chrome.cast.Session | null
      addEventListener(
        type: string,
        handler: (event: { castState: CastState }) => void,
      ): void
      removeEventListener(
        type: string,
        handler: (event: { castState: CastState }) => void,
      ): void
    }

    const CastContextEventType: {
      CAST_STATE_CHANGED: string
    }
  }
}

interface Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void
  cast?: typeof cast
}
