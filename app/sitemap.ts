import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
  const now = new Date()

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/videos`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/movies`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/shorts`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteUrl}/podcasts`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/verticals`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ]
}
