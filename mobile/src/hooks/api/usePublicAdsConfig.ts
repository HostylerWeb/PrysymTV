import { useQuery } from '@tanstack/react-query';
import { fetchPublicConfig } from '@/lib/api/public-config';
import type { AdPlacement } from '@/lib/api/ads';
import { useCallback } from 'react';

export function usePublicAdsConfig() {
  const query = useQuery({
    queryKey: ['config', 'public', 'ads'],
    queryFn: async () => {
      const config = await fetchPublicConfig();
      return config.ads;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isPlacementEnabled = useCallback(
    (placement: AdPlacement) => {
      if (query.isLoading) return false;
      return query.data?.placements[placement] ?? true;
    },
    [query.data, query.isLoading],
  );

  return {
    config: query.data,
    isLoading: query.isLoading,
    shortsInterstitialEveryNSwipes: query.data?.shortsInterstitialEveryNSwipes ?? 5,
    shortsInterstitialEnabled: query.data?.shortsInterstitialEnabled ?? true,
    platformCreatorId: query.data?.platformCreatorId ?? undefined,
    isPlacementEnabled,
  };
}
