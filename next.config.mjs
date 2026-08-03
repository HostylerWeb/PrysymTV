/** @type {import('next').NextConfig} */

function hostnameFromEnvUrl(value) {
  if (!value) return null
  try {
    return new URL(value).hostname
  } catch {
    return null
  }
}

const apiHost = hostnameFromEnvUrl(process.env.NEXT_PUBLIC_API_URL)
const siteHost = hostnameFromEnvUrl(process.env.NEXT_PUBLIC_SITE_URL)

const remotePatterns = [
  { protocol: "https", hostname: "**.r2.dev" },
  { protocol: "https", hostname: "**.cloudflare.com" },
  { protocol: "https", hostname: "api.dicebear.com" },
  { protocol: "http", hostname: "localhost" },
  { protocol: "http", hostname: "127.0.0.1" },
]

for (const host of [apiHost, siteHost]) {
  if (!host) continue
  if (host === "localhost" || host === "127.0.0.1") continue
  remotePatterns.push({ protocol: "https", hostname: host })
  remotePatterns.push({ protocol: "http", hostname: host })
}

const nextConfig = {
  images: {
    remotePatterns,
    minimumCacheTTL: 60 * 60 * 24 * 7,
    // Self-hosted VPS: API assets use the public site hostname, which may resolve locally.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "production",
  },
  output: "standalone",
}

export default nextConfig

