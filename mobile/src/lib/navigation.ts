import type { Href, Router } from 'expo-router';

const DEFAULT_FALLBACK: Href = '/(tabs)/home';

export function navigateBack(router: Router, fallback: Href = DEFAULT_FALLBACK) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
