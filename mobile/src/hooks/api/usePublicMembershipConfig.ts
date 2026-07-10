import { useQuery } from '@tanstack/react-query';
import { fetchPublicConfig } from '@/lib/api/public-config';

export function usePublicMembershipConfig() {
  const query = useQuery({
    queryKey: ['config', 'public', 'membership'],
    queryFn: fetchPublicConfig,
    staleTime: 5 * 60 * 1000,
  });

  return {
    membership: query.data?.membership,
    insider: query.data?.insider,
    isLoading: query.isLoading,
  };
}
