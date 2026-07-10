import { Image } from 'expo-image';

/** Warm disk/memory cache for profile media; URL version query busts cache after uploads. */
export function prefetchProfileMedia(urls: Array<string | null | undefined>) {
  for (const url of urls) {
    const trimmed = url?.trim();
    if (!trimmed) continue;
    void Image.prefetch(trimmed);
  }
}
