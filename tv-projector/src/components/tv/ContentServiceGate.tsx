import type { ComponentType, ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import type { ContentServiceKey } from '@/lib/content-services';
import { useContentServices } from '@/hooks/api/useContentServices';

type ContentServiceGateProps = {
  service: ContentServiceKey;
  children: ReactNode;
};

export function ContentServiceGate({ service, children }: ContentServiceGateProps) {
  const router = useRouter();
  const { isEnabled, hasRemoteConfig } = useContentServices();
  const enabled = isEnabled(service);

  useEffect(() => {
    if (!hasRemoteConfig) return;
    if (!enabled) router.replace('/(main)');
  }, [enabled, hasRemoteConfig, router]);

  if (!hasRemoteConfig) return null;
  if (!enabled) return null;
  return <>{children}</>;
}

export function withContentServiceGate<P extends object>(
  service: ContentServiceKey,
  Component: ComponentType<P>,
) {
  return function GuardedScreen(props: P) {
    return (
      <ContentServiceGate service={service}>
        <Component {...props} />
      </ContentServiceGate>
    );
  };
}
