"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

const HlsVideoPlayer = dynamic(
  () => import("@/components/hls-video-player").then((m) => m.HlsVideoPlayer),
  { ssr: false },
)

export { HlsVideoPlayer }
export type HlsVideoPlayerProps = ComponentProps<typeof HlsVideoPlayer>
