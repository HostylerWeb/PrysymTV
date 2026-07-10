import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { navigateBack } from '@/lib/navigation';

export function useBackNavigation(fallback?: Href) {
  const router = useRouter();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      navigateBack(router, fallback);
      return true;
    });
    return () => subscription.remove();
  }, [router, fallback]);
}
