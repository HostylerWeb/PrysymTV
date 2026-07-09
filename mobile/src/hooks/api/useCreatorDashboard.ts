import { useQuery } from '@tanstack/react-query';
import { fetchCreatorDashboard } from '@/lib/api/analytics';
import {
  fetchCreatorBalance,
  fetchCreatorPayoutProfile,
} from '@/lib/api/billing-monetization';

export function useCreatorDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['creator', 'dashboard'],
    queryFn: fetchCreatorDashboard,
  });

  const balanceQuery = useQuery({
    queryKey: ['creator', 'balance'],
    queryFn: fetchCreatorBalance,
  });

  const payoutProfileQuery = useQuery({
    queryKey: ['creator', 'payout-profile'],
    queryFn: fetchCreatorPayoutProfile,
  });

  return {
    dashboard: dashboardQuery.data,
    balance: balanceQuery.data,
    payoutProfile: payoutProfileQuery.data,
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
    refetch: () => {
      void dashboardQuery.refetch();
      void balanceQuery.refetch();
      void payoutProfileQuery.refetch();
    },
  };
}
