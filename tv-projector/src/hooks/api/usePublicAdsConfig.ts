import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchPublicConfig } from '@/lib/api/public-config';
import type { AdPlacement } from '@/lib/api/ads';

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
    platformCreatorId: query.data?.platformCreatorId ?? undefined,
    isPlacementEnabled,
  };
}
