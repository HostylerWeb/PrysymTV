import { proxyMediaAssetUrl } from "@/lib/format-media";

/** Stock photos previously used as defaults — treat as missing so users get initials. */
const LEGACY_STOCK_AVATAR_MARKERS = [
  "photo-1472099645785",
  "photo-1535713875002",
];

function isLegacyStockAvatar(url: string): boolean {
  return LEGACY_STOCK_AVATAR_MARKERS.some((m) => url.includes(m));
}

/** Neutral initials avatar when the user has not uploaded a photo. */
export function defaultAvatarUrl(seed: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_AVATAR_URL?.trim();
  if (fromEnv) return fromEnv;

  const safeSeed = encodeURIComponent(
    (seed || "user").replace(/^@/, "").slice(0, 32) || "user",
  );
  return `https://api.dicebear.com/7.x/initials/png?seed=${safeSeed}&backgroundColor=6366f1,475569`;
}

export function userAvatarUrl(
  avatarUrl: string | null | undefined,
  seed: string,
): string {
  const trimmed = avatarUrl?.trim();
  if (trimmed && !isLegacyStockAvatar(trimmed)) {
    if (/\.r2\.dev\//i.test(trimmed)) return proxyMediaAssetUrl(trimmed);
    return trimmed;
  }
  return defaultAvatarUrl(seed);
}

export function profileBannerUrl(bannerUrl: string | null | undefined): string | null {
  const trimmed = bannerUrl?.trim();
  if (!trimmed) return null;
  if (/\.r2\.dev\//i.test(trimmed)) return proxyMediaAssetUrl(trimmed);
  return trimmed;
}

export function withUploadVersion(publicUrl: string): string {
  const base = publicUrl.split("?")[0];
  return `${base}?v=${Date.now()}`;
}
