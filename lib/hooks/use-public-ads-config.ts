"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchPublicConfig, type PublicAdsConfig } from "@/lib/api/config";
import type { AdPlacement } from "@/lib/api/ads";

export function usePublicAdsConfig() {
  const [config, setConfig] = useState<PublicAdsConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicConfig()
      .then((res) => {
        if (!cancelled) setConfig(res.ads);
      })
      .catch(() => {
        if (!cancelled) {
          setConfig({
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
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isPlacementEnabled = useCallback(
    (placement: AdPlacement) => config?.placements[placement] ?? true,
    [config],
  );

  return {
    config,
    loading: config === null,
    isPlacementEnabled,
    platformCreatorId: config?.platformCreatorId ?? undefined,
  };
}
