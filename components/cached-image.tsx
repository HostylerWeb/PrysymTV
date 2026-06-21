"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type CachedImageProps = {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
}

function isOptimizable(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")
}

/** Image with Next.js caching when remote; falls back to img for data/blob URLs. */
export function CachedImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority,
  sizes,
}: CachedImageProps) {
  if (!src) return null

  if (!isOptimizable(src) || src.startsWith("blob:") || src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 400}
      height={height ?? 400}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  )
}
