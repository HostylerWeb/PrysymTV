import { apiRequest } from './client';
import type { AdPlacement } from './ads';

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

export type PublicOAuthConfig = {
  google: {
    enabled: boolean;
    webClientId: string | null;
    iosClientId: string | null;
    androidClientId: string | null;
  };
  apple: {
    enabled: boolean;
    webClientId: string | null;
    iosClientId: string | null;
  };
  facebook: {
    enabled: boolean;
    appId: string | null;
  };
};

export type PublicPushConfig = {
  enabled: boolean;
  publicKey: string | null;
};

export type PublicAppConfig = {
  ads: PublicAdsConfig;
  membership: PublicMembershipConfig;
  insider: PublicMembershipConfig;
  channelMembership: {
    basic: PublicChannelMembershipTier;
    premium: PublicChannelMembershipTier;
  };
  auth: PublicOAuthConfig;
  push: PublicPushConfig;
};

export function fetchPublicConfig() {
  return apiRequest<PublicAppConfig>('/config/public', { auth: false });
}
