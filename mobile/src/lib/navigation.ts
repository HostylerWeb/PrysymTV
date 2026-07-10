import type { Href, Router } from 'expo-router';

const DEFAULT_FALLBACK: Href = '/(tabs)/home';

/**
 * Navigate back from a stack screen pushed on top of tabs.
 * router.back() often pops past (tabs) on Android and closes the app,
 * so we always replace to a known tab route instead.
 */
export function navigateBack(router: Router, fallback: Href = DEFAULT_FALLBACK) {
  router.replace(fallback);
}
