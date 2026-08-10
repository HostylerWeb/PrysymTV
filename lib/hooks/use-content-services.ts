"use client"

import { useMemo } from "react"
import {
  type ContentServiceKey,
  type ContentServicesSettings,
  resolveContentServices,
  isContentServiceEnabled,
} from "@/lib/content-services"
import { usePublicConfig } from "@/lib/hooks/use-public-config"

export function useContentServices() {
  const { data, isLoading, isError } = usePublicConfig()
  const services = useMemo(
    () => resolveContentServices(data?.services),
    [data?.services],
  )

  return {
    services,
    isLoading,
    isError,
    hasRemoteConfig: data !== undefined,
    isEnabled: (service: ContentServiceKey) => isContentServiceEnabled(services, service),
  }
}

export type { ContentServiceKey, ContentServicesSettings }
