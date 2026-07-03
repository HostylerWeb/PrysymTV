"use client"

import { activeSocialLinks, platformByKey, type SocialLinkRecord } from "@/lib/social-platforms"
import { SocialPlatformIcon, socialPlatformStyles } from "@/components/social-platform-icon"
import { cn } from "@/lib/utils"

type CreatorSocialLinksProps = {
  links?: SocialLinkRecord[] | null
  className?: string
  size?: "sm" | "md"
}

function normalizeHref(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function CreatorSocialLinks({
  links,
  className,
  size = "md",
}: CreatorSocialLinksProps) {
  const active = activeSocialLinks(links)
  if (!active.length) return null

  const buttonSize = size === "sm" ? "w-9 h-9" : "w-11 h-11"
  const iconSize = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]"

  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      {active.map((link) => {
        const styles = socialPlatformStyles(link.key)
        const platform = platformByKey(link.key)
        return (
          <a
            key={link.key}
            href={normalizeHref(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            title={platform.label}
            aria-label={`${platform.label} profile`}
            className={cn(
              "group inline-flex items-center justify-center rounded-full border border-border/60 bg-secondary/40 transition-all duration-200",
              buttonSize,
              styles.hover,
              "hover:scale-105 hover:shadow-md",
            )}
          >
            <SocialPlatformIcon
              platform={link.key}
              className={cn(iconSize, styles.icon, "transition-colors group-hover:text-inherit")}
            />
          </a>
        )
      })}
    </div>
  )
}
