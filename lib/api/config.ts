import { apiRequest } from "@/lib/api-client";
import type { AdPlacement } from "@/lib/api/ads";

export type PublicAdsConfig = {
  shortsInterstitialEveryNSwipes: number;
  shortsInterstitialEnabled: boolean;
  shortsSkipSeconds: number;
  moviePrerollSkipSeconds: number;
  impressionRevenueCpmUsd: number;
  platformCreatorId: string | null;
  placements: Record<AdPlacement, boolean>;
};

export type PublicMembershipConfig = {
  priceUsd: number;
  label: string;
  perks: string[];
};

export function fetchPublicConfig() {
  return apiRequest<{ ads: PublicAdsConfig; membership: PublicMembershipConfig }>(
    "/config/public",
    { auth: false },
  );
}
