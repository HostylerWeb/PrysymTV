import { useQuery } from '@tanstack/react-query';
import { fetchPublicConfig } from '@/lib/api/public-config';

export function usePublicAdsConfig() {
  const query = useQuery({
    queryKey: ['config', 'public', 'ads'],
    queryFn: async () => {
      const config = await fetchPublicConfig();
      return config.ads;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    config: query.data,
    isLoading: query.isLoading,
    shortsInterstitialEveryNSwipes: query.data?.shortsInterstitialEveryNSwipes ?? 5,
    shortsInterstitialEnabled: query.data?.shortsInterstitialEnabled ?? true,
    platformCreatorId: query.data?.platformCreatorId ?? undefined,
  };
}
