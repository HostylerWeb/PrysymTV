import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type ContentServiceKey,
  type ContentServicesSettings,
  isContentServiceEnabled,
  resolveContentServices,
} from '@/lib/content-services';
import { fetchPublicConfig } from '@/lib/api/public-config';

const PUBLIC_CONFIG_QUERY_KEY = ['public-config'] as const;

export function useContentServices() {
  const { data, isLoading, isError } = useQuery({
    queryKey: PUBLIC_CONFIG_QUERY_KEY,
    queryFn: fetchPublicConfig,
    staleTime: 60_000,
    refetchOnMount: true,
  });

  const services = useMemo(
    () => resolveContentServices(data?.services),
    [data?.services],
  );

  return {
    services,
    isLoading,
    isError,
    hasRemoteConfig: data !== undefined,
    isEnabled: (service: ContentServiceKey) => isContentServiceEnabled(services, service),
  };
}

export type { ContentServiceKey, ContentServicesSettings };
