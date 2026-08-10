"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import type { PublicAppConfig } from "@/lib/api/config"
import { PUBLIC_CONFIG_QUERY_KEY } from "@/lib/hooks/use-public-config"

export function QueryProvider({
  children,
  initialPublicConfig = null,
}: {
  children: ReactNode
  initialPublicConfig?: PublicAppConfig | null
}) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
    if (initialPublicConfig) {
      queryClient.setQueryData(PUBLIC_CONFIG_QUERY_KEY, initialPublicConfig)
    }
    return queryClient
  })

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
