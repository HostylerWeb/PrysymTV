"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  type ContentServiceKey,
  isContentServiceEnabled,
  resolveContentServices,
} from "@/lib/content-services"
import { usePublicConfig } from "@/lib/hooks/use-public-config"

type ContentServiceGateProps = {
  service: ContentServiceKey
  children: React.ReactNode
}

/** Redirects to home when a consumer section is disabled in platform settings. */
export function ContentServiceGate({ service, children }: ContentServiceGateProps) {
  const router = useRouter()
  const { data, isLoading } = usePublicConfig()
  const services = resolveContentServices(data?.services)
  const enabled = isContentServiceEnabled(services, service)

  useEffect(() => {
    if (isLoading) return
    if (!enabled) router.replace("/")
  }, [enabled, isLoading, router])

  if (isLoading) return null
  if (!enabled) return null
  return <>{children}</>
}
