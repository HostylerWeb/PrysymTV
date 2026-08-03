"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchPublicConfig, type PublicAppConfig } from "@/lib/api/config"

export const PUBLIC_CONFIG_QUERY_KEY = ["public-config"] as const

export function usePublicConfig() {
  return useQuery({
    queryKey: PUBLIC_CONFIG_QUERY_KEY,
    queryFn: fetchPublicConfig,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })
}

export function selectPublicAds(config: PublicAppConfig) {
  return config.ads
}

export function selectPublicAuth(config: PublicAppConfig) {
  return config.auth
}
