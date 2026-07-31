import { proxyMediaAssetUrl } from "@/lib/format-media"

export function resolveAdMediaUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null
  return proxyMediaAssetUrl(trimmed)
}
