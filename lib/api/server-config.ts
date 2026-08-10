import type { PublicAppConfig } from "@/lib/api/config"
import { serverFetchJson } from "@/lib/api/server-fetch"

/** Server-side public config for SSR (nav, OAuth, service toggles). */
export async function fetchPublicConfigServer(): Promise<PublicAppConfig | null> {
  try {
    return await serverFetchJson<PublicAppConfig>("/config/public", {
      revalidate: 60,
    })
  } catch {
    return null
  }
}
