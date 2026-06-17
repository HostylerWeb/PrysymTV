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

export type PublicChannelMembershipTier = {
  priceUsd: number;
  label: string;
};

export function fetchPublicConfig() {
  return apiRequest<{
    ads: PublicAdsConfig;
    membership: PublicMembershipConfig;
    channelMembership: {
      basic: PublicChannelMembershipTier;
      premium: PublicChannelMembershipTier;
    };
  }>("/config/public", { auth: false });
}
