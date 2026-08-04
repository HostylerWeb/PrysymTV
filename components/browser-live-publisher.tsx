"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Camera, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { captureAndUploadStreamThumbnail } from "@/lib/stream-thumbnail"

type Publisher = { close: () => void }

type PublisherCtor = new (conf: {
  url: string
  stream: MediaStream
  videoCodec?: string
  videoBitrate?: string
  audioCodec?: string
  audioBitrate?: string
  audioVoice?: boolean
  onError?: (err: string) => void
  onConnected?: () => void
}) => Publisher

declare global {
  interface Window {
    MediaMTXWebRTCPublisher?: PublisherCtor
  }
}

type DeviceOption = { deviceId: string; label: string }

/** Match MediaMTX publish page — pick codecs the browser can actually send. */
async function detectPublisherCodecs(): Promise<{
  videoCodec: string
  audioCodec: string
}> {
  const pc = new RTCPeerConnection({})
  pc.addTransceiver("video", { direction: "sendonly" })
  pc.addTransceiver("audio", { direction: "sendonly" })
  const desc = await pc.createOffer()
  const sdp = desc.sdp?.toLowerCase() ?? ""
  pc.close()

  const videoCodec =
    ["h264/90000", "vp8/90000", "vp9/90000", "av1/90000", "h265/90000"].find((c) =>
      sdp.includes(c),
    ) ?? "vp8/90000"
  const audioCodec =
    ["opus/48000", "g722/8000", "pcmu/8000", "pcma/8000"].find((c) => sdp.includes(c)) ??
    "opus/48000"

  return { videoCodec, audioCodec }
}

function mapDevices(
  devices: MediaDeviceInfo[],
  kind: "videoinput" | "audioinput",
): DeviceOption[] {
  return devices
    .filter((d) => d.kind === kind && d.deviceId)
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label?.trim() || `${kind === "videoinput" ? "Camera" : "Microphone"} ${i + 1}`,
    }))
}

type BrowserLivePublisherProps = {
  whipPublishUrl: string
  streamId?: string
  /** When false, only local camera preview (no broadcast). */
  publishing?: boolean
  className?: string
  onConnected?: () => void
  onError?: (message: string) => void
  onPreviewReady?: () => void
}

export function BrowserLivePublisher({
  whipPublishUrl,
  streamId,
  publishing = false,
  className,
  onConnected,
  onError,
  onPreviewReady,
}: BrowserLivePublisherProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const publisherRef = useRef<Publisher | null>(null)
  const mediaRef = useRef<MediaStream | null>(null)
  const skipDeviceSwitch = useRef(true)

  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && !!window.MediaMTXWebRTCPublisher,
  )
  const [previewReady, setPreviewReady] = useState(false)
  const [connected, setConnected] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoDevices, setVideoDevices] = useState<DeviceOption[]>([])
  const [audioDevices, setAudioDevices] = useState<DeviceOption[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState("")
  const [selectedAudioId, setSelectedAudioId] = useState("")
  const [mirrorPreview, setMirrorPreview] = useState(true)

  const refreshDeviceLists = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const devices = await navigator.mediaDevices.enumerateDevices()
    setVideoDevices(mapDevices(devices, "videoinput"))
    setAudioDevices(mapDevices(devices, "audioinput"))
  }, [])

  const attachMedia = useCallback((media: MediaStream) => {
    mediaRef.current = media
    const el = videoRef.current
    if (el) {
      el.srcObject = media
      void el.play().catch(() => {})
    }
    const videoTrack = media.getVideoTracks()[0]
    const audioTrack = media.getAudioTracks()[0]
    if (videoTrack) {
      setCameraOn(videoTrack.enabled)
      const id = videoTrack.getSettings().deviceId
      if (id) setSelectedVideoId(id)
    }
    if (audioTrack) {
      setMicOn(audioTrack.enabled)
      const id = audioTrack.getSettings().deviceId
      if (id) setSelectedAudioId(id)
    }
    setPreviewReady(true)
    onPreviewReady?.()
  }, [onPreviewReady])

  const acquireMedia = useCallback(
    async (videoDeviceId?: string, audioDeviceId?: string) => {
      const videoConstraint = videoDeviceId
        ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: "user" as const, width: { ideal: 1280 }, height: { ideal: 720 } }

      const media = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: {
          ...(audioDeviceId ? { deviceId: { exact: audioDeviceId } } : {}),
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      return media
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    async function startPreview() {
      try {
        const media = await acquireMedia()
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop())
          return
        }
        attachMedia(media)
        await refreshDeviceLists()
        skipDeviceSwitch.current = false
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not access camera or microphone"
        setError(msg)
        onError?.(msg)
      }
    }

    void startPreview()

    const onDeviceChange = () => {
      void refreshDeviceLists()
    }
    navigator.mediaDevices?.addEventListener("devicechange", onDeviceChange)

    return () => {
      cancelled = true
      navigator.mediaDevices?.removeEventListener("devicechange", onDeviceChange)
      publisherRef.current?.close()
      publisherRef.current = null
      mediaRef.current?.getTracks().forEach((t) => t.stop())
      mediaRef.current = null
    }
  }, [acquireMedia, attachMedia, onError, refreshDeviceLists])

  useEffect(() => {
    if (skipDeviceSwitch.current || publishing) return

    let cancelled = false

    async function switchDevices() {
      try {
        mediaRef.current?.getTracks().forEach((t) => t.stop())
        const media = await acquireMedia(
          selectedVideoId || undefined,
          selectedAudioId || undefined,
        )
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop())
          return
        }
        attachMedia(media)
        await refreshDeviceLists()
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not switch camera or microphone"
        setError(msg)
        onError?.(msg)
      }
    }

    void switchDevices()

    return () => {
      cancelled = true
    }
  }, [
    selectedVideoId,
    selectedAudioId,
    publishing,
    acquireMedia,
    attachMedia,
    onError,
    refreshDeviceLists,
  ])

  useEffect(() => {
    if (!publishing || !scriptReady || !previewReady || !mediaRef.current || !whipPublishUrl) {
      if (!publishing) {
        publisherRef.current?.close()
        publisherRef.current = null
        setConnected(false)
      }
      return
    }

    let cancelled = false
    const media = mediaRef.current

    async function startPublish() {
      try {
        const { videoCodec, audioCodec } = await detectPublisherCodecs()
        if (cancelled || !media) return

        publisherRef.current?.close()
        const publisher = new window.MediaMTXWebRTCPublisher!({
          url: whipPublishUrl,
          stream: media,
          videoCodec,
          videoBitrate: "2500",
          audioCodec,
          audioBitrate: "128",
          audioVoice: true,
          onConnected: () => {
            if (!cancelled) {
              setConnected(true)
              onConnected?.()
              const video = videoRef.current
              if (streamId && video) {
                void captureAndUploadStreamThumbnail(streamId, video)
              }
            }
          },
          onError: (msg) => {
            if (!cancelled) {
              setError(msg)
              setConnected(false)
              onError?.(msg)
            }
          },
        })
        publisherRef.current = publisher
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not start broadcast"
        setError(msg)
        onError?.(msg)
      }
    }

    void startPublish()

    return () => {
      cancelled = true
      publisherRef.current?.close()
      publisherRef.current = null
      setConnected(false)
    }
  }, [publishing, scriptReady, previewReady, whipPublishUrl, onConnected, onError])

  const toggleVideo = () => {
    const track = mediaRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCameraOn(track.enabled)
  }

  const toggleAudio = () => {
    const track = mediaRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMicOn(track.enabled)
  }

  const activeVideoLabel =
    videoDevices.find((d) => d.deviceId === selectedVideoId)?.label ?? "Default camera"
  const activeAudioLabel =
    audioDevices.find((d) => d.deviceId === selectedAudioId)?.label ?? "Default microphone"

  const statusLabel = !publishing
    ? "PREVIEW"
    : connected
      ? "BROADCASTING"
      : "GOING LIVE…"

  return (
    <div className={cn("flex flex-col h-full bg-zinc-950 overflow-hidden", className)}>
      {!scriptReady && (
        <Script
          src="/mediamtx-publisher.js"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}

      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-contain",
            mirrorPreview && "[transform:scaleX(-1)]",
          )}
          playsInline
          muted
          autoPlay
        />
        {mirrorPreview ? (
          <p className="absolute top-12 left-3 right-3 text-[10px] leading-snug text-white/80 bg-black/45 rounded px-2 py-1 pointer-events-none">
            Mirrored preview only — viewers (including mobile) see the normal image.
          </p>
        ) : null}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1.5",
              publishing && connected
                ? "bg-primary text-white"
                : publishing
                  ? "bg-amber-600 text-white"
                  : "bg-zinc-700 text-white",
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full bg-white",
                publishing && connected && "animate-pulse",
              )}
            />
            {statusLabel}
          </span>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="rounded-full h-11 w-11 bg-black/50 backdrop-blur border-0"
            onClick={toggleVideo}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="rounded-full h-11 w-11 bg-black/50 backdrop-blur border-0"
            onClick={toggleAudio}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
        </div>
        {error && (
          <div className="absolute inset-x-3 bottom-16 rounded-lg bg-destructive/90 text-destructive-foreground text-xs px-3 py-2">
            {error}
          </div>
        )}
        {!previewReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <Camera className="w-10 h-10 text-white/70 animate-pulse" />
          </div>
        )}
      </div>

      {!publishing && previewReady && (
        <details className="shrink-0 border-t border-white/10 bg-zinc-900/95 p-3 group">
          <summary className="text-xs text-zinc-300 cursor-pointer list-none flex items-center justify-between">
            <span>Camera &amp; microphone</span>
            <span className="text-zinc-500 group-open:hidden">Tap to change</span>
          </summary>
          <div className="mt-3 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                Camera
              </span>
              <select
                value={selectedVideoId}
                onChange={(e) => setSelectedVideoId(e.target.value)}
                className="w-full h-10 rounded-lg bg-zinc-800 border border-white/10 text-sm text-white px-3"
              >
                {videoDevices.length === 0 ? (
                  <option value="">{activeVideoLabel}</option>
                ) : (
                  videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg bg-zinc-800/80 border border-white/10 px-3 py-2.5">
              <span className="text-xs font-medium text-zinc-300">Mirror preview (selfie view)</span>
              <input
                type="checkbox"
                checked={mirrorPreview}
                onChange={(e) => setMirrorPreview(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                Microphone
              </span>
              <select
                value={selectedAudioId}
                onChange={(e) => setSelectedAudioId(e.target.value)}
                className="w-full h-10 rounded-lg bg-zinc-800 border border-white/10 text-sm text-white px-3"
              >
                {audioDevices.length === 0 ? (
                  <option value="">{activeAudioLabel}</option>
                ) : (
                  audioDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
        </details>
      )}
    </div>
  )
}
