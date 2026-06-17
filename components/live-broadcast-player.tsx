"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { HlsVideoPlayer } from "@/components/hls-video-player"

type MediamtxReader = {
  close: () => void
}

type MediamtxReaderCtor = new (conf: {
  url: string
  onError?: (err: string) => void
  onTrack?: (evt: RTCTrackEvent) => void
}) => MediamtxReader

declare global {
  interface Window {
    MediaMTXWebRTCReader?: MediamtxReaderCtor
  }
}

type LiveBroadcastPlayerProps = {
  webrtcUrl?: string | null
  hlsUrl?: string | null
  poster?: string | null
  className?: string
  autoPlay?: boolean
  muted?: boolean
  videoRef?: React.RefObject<HTMLVideoElement | null>
}

/**
 * Live watch player: WebRTC/WHEP first (~0.5–1.5s delay), LL-HLS fallback (~2–4s).
 */
export function LiveBroadcastPlayer({
  webrtcUrl,
  hlsUrl,
  poster,
  className = "w-full h-full object-contain bg-black",
  autoPlay = true,
  muted = false,
  videoRef: externalRef,
}: LiveBroadcastPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalRef ?? internalRef
  const readerRef = useRef<MediamtxReader | null>(null)
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && !!window.MediaMTXWebRTCReader,
  )
  const [useHlsFallback, setUseHlsFallback] = useState(!webrtcUrl?.trim())

  useEffect(() => {
    setUseHlsFallback(!webrtcUrl?.trim())
  }, [webrtcUrl])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = muted
  }, [muted, videoRef])

  useEffect(() => {
    const el = videoRef.current
    if (
      useHlsFallback ||
      !webrtcUrl?.trim() ||
      !scriptReady ||
      !window.MediaMTXWebRTCReader ||
      !el
    ) {
      return
    }

    let cancelled = false

    readerRef.current?.close()
    readerRef.current = null
    el.srcObject = null

    const reader = new window.MediaMTXWebRTCReader({
      url: webrtcUrl,
      onTrack: (evt) => {
        if (cancelled || !el) return
        const stream = evt.streams[0]
        if (stream) {
          el.srcObject = stream
          if (autoPlay) {
            void el.play().catch(() => {})
          }
        }
      },
      onError: () => {
        if (!cancelled) setUseHlsFallback(true)
      },
    })
    readerRef.current = reader

    return () => {
      cancelled = true
      reader.close()
      readerRef.current = null
      if (el.srcObject) {
        el.srcObject = null
      }
    }
  }, [webrtcUrl, scriptReady, useHlsFallback, autoPlay, videoRef])

  if (useHlsFallback && hlsUrl) {
    return (
      <HlsVideoPlayer
        key={hlsUrl}
        src={hlsUrl}
        poster={poster}
        className={className}
        autoPlay={autoPlay}
        controls={false}
        muted={muted}
        playsInline
        liveLowLatency
        videoRef={videoRef}
      />
    )
  }

  return (
    <>
      {!scriptReady && (
        <Script
          src="/mediamtx-reader.js"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}
      <video
        ref={videoRef}
        className={className}
        poster={poster ?? undefined}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
      />
    </>
  )
}
