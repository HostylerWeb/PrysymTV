"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Mobile-friendly fullscreen: CSS overlay instead of native video fullscreen,
 * which avoids iOS/Android fighting device rotation.
 */
export function useImmersivePlayer() {
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const [isImmersive, setIsImmersive] = useState(false)

  const isMobileViewport = useCallback(
    () => window.matchMedia("(max-width: 768px)").matches,
    [],
  )

  const exitImmersive = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    }
    setIsImmersive(false)
    try {
      screen.orientation?.unlock()
    } catch {
      /* unsupported */
    }
  }, [])

  const enterImmersive = useCallback(() => {
    const container = playerContainerRef.current
    if (!container) return

    if (isMobileViewport()) {
      setIsImmersive(true)
      return
    }

    void container.requestFullscreen().catch(() => setIsImmersive(true))
  }, [isMobileViewport])

  const toggleImmersive = useCallback(() => {
    if (isImmersive || document.fullscreenElement) {
      exitImmersive()
      return
    }
    enterImmersive()
  }, [isImmersive, exitImmersive, enterImmersive])

  useEffect(() => {
    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        setIsImmersive(true)
        return
      }
      if (isMobileViewport()) return
      setIsImmersive(false)
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [isMobileViewport])

  useEffect(() => {
    document.body.style.overflow = isImmersive ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isImmersive])

  useEffect(() => {
    if (!isImmersive) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitImmersive()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isImmersive, exitImmersive])

  const immersiveClassName =
    "fixed inset-0 z-[100] flex items-center justify-center bg-black w-[100dvw] h-[100dvh] max-w-none aspect-auto"

  return {
    playerContainerRef,
    isImmersive,
    toggleImmersive,
    enterImmersive,
    exitImmersive,
    immersiveClassName,
  }
}
