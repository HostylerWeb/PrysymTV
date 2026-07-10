export type HomeBannerSize = "strip" | "standard" | "hero"

export const HOME_BANNER_SIZE_OPTIONS: Array<{
  value: HomeBannerSize
  label: string
  description: string
  webAspectClass: string
  mobileHeight: number
}> = [
  {
    value: "strip",
    label: "Strip",
    description: "Wide leaderboard (6:1 web, compact strip on mobile)",
    webAspectClass: "aspect-[6/1]",
    mobileHeight: 72,
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced banner (8:1 web, medium strip on mobile)",
    webAspectClass: "aspect-[8/1]",
    mobileHeight: 100,
  },
  {
    value: "hero",
    label: "Hero",
    description: "Taller spotlight (16:9 web, large card on mobile)",
    webAspectClass: "aspect-video",
    mobileHeight: 180,
  },
]

export function resolveHomeBannerSize(size?: string | null): HomeBannerSize {
  if (size === "standard" || size === "hero") return size
  return "strip"
}

export function getHomeBannerSizeConfig(size?: string | null) {
  const resolved = resolveHomeBannerSize(size)
  return HOME_BANNER_SIZE_OPTIONS.find((option) => option.value === resolved) ?? HOME_BANNER_SIZE_OPTIONS[0]
}
