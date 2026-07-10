import { getWsUrl } from '@/lib/api/config';

export function buildLiveCameraPublisherUri(whipPublishUrl: string) {
  const origin = getWsUrl().replace(/\/$/, '');
  return `${origin}/mobile-live-publisher.html?whip=${encodeURIComponent(whipPublishUrl)}`;
}
