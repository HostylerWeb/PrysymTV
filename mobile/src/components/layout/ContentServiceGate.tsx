import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import type { ContentServiceKey } from '@/lib/content-services';
import { useContentServices } from '@/hooks/api/useContentServices';

type ContentServiceGateProps = {
  service: ContentServiceKey;
  children: React.ReactNode;
};

export function ContentServiceGate({ service, children }: ContentServiceGateProps) {
  const router = useRouter();
  const { isEnabled, hasRemoteConfig } = useContentServices();
  const enabled = isEnabled(service);

  useEffect(() => {
    if (!hasRemoteConfig) return;
    if (!enabled) router.replace('/(tabs)/home');
  }, [enabled, hasRemoteConfig, router]);

  if (!hasRemoteConfig) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!enabled) return null;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function withContentServiceGate<P extends object>(
  service: ContentServiceKey,
  Component: React.ComponentType<P>,
) {
  return function GuardedScreen(props: P) {
    return (
      <ContentServiceGate service={service}>
        <Component {...props} />
      </ContentServiceGate>
    );
  };
}
