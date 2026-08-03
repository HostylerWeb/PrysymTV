"use client";

import { useCallback } from "react";
import type { AdPlacement } from "@/lib/api/ads";
import type { PublicAdsConfig } from "@/lib/api/config";
import { selectPublicAds, usePublicConfig } from "@/lib/hooks/use-public-config";

const FALLBACK_ADS: PublicAdsConfig = {
  shortsInterstitialEveryNSwipes: 5,
  shortsInterstitialEnabled: true,
  shortsSkipSeconds: 5,
  moviePrerollSkipSeconds: 15,
  impressionRevenueCpmUsd: 0,
  platformCreatorId: null,
  placements: {
    home_banner: true,
    shorts_interstitial: true,
    movie_preroll: true,
    vertical_episode: true,
  },
};

export function usePublicAdsConfig() {
  const { data, isLoading } = usePublicConfig();
  const config = data ? selectPublicAds(data) : null;

  const isPlacementEnabled = useCallback(
    (placement: AdPlacement) => config?.placements[placement] ?? true,
    [config],
  );

  return {
    config: config ?? FALLBACK_ADS,
    loading: isLoading && !config,
    isPlacementEnabled,
    platformCreatorId: config?.platformCreatorId ?? undefined,
  };
}
