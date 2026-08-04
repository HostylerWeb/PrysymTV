/** @type {import('next').NextConfig} */

function hostnameFromEnvUrl(value) {
  if (!value) return null
  try {
    return new URL(value).hostname
  } catch {
    return null
  }
}

/** Build a remotePatterns entry for API-hosted thumbnails/posters (/assets/*). */
function remotePatternFromApiUrl(value) {
  if (!value) return null
  try {
    const base = new URL(value.replace(/\/$/, ""))
    const pathname = `${base.pathname.replace(/\/$/, "")}/assets/**`
    const pattern = {
      protocol: base.protocol.replace(":", ""),
      hostname: base.hostname,
      pathname,
    }
    if (base.port) pattern.port = base.port
    return pattern
  } catch {
    return null
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL
const apiHost = hostnameFromEnvUrl(apiUrl)
const siteHost = hostnameFromEnvUrl(process.env.NEXT_PUBLIC_SITE_URL)
const apiAssetPattern = remotePatternFromApiUrl(apiUrl)

const remotePatterns = [
  { protocol: "https", hostname: "**.r2.dev" },
  { protocol: "https", hostname: "**.cloudflare.com" },
  { protocol: "https", hostname: "api.dicebear.com" },
  { protocol: "http", hostname: "localhost", port: "4000", pathname: "/api/v1/assets/**" },
  { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/api/v1/assets/**" },
]

if (apiAssetPattern) {
  remotePatterns.push(apiAssetPattern)
}

for (const host of [apiHost, siteHost]) {
  if (!host) continue
  if (host === "localhost" || host === "127.0.0.1") continue
  remotePatterns.push({ protocol: "https", hostname: host, pathname: "/api/v1/assets/**" })
  remotePatterns.push({ protocol: "http", hostname: host, pathname: "/api/v1/assets/**" })
}

const nextConfig = {
  images: {
    remotePatterns,
    minimumCacheTTL: 60 * 60 * 24 * 7,
    // Self-hosted VPS: API assets may resolve to a local/private IP from the Next server.
    dangerouslyAllowLocalIP: true,
  },
  output: "standalone",
}

export default nextConfig
