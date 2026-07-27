import { useEffect } from 'react';
import { trackView, trackWatchTime } from '@/lib/api/analytics';

type UseWatchAnalyticsOptions = {
  creatorId?: string;
  viewerUserId?: string;
  enabled?: boolean;
};

/** Tracks a view on mount and sends watch_time heartbeats every 30 seconds. */
export function useWatchAnalytics(
  targetId: string | undefined,
  options?: UseWatchAnalyticsOptions,
) {
  const enabled = options?.enabled !== false && !!targetId;

  useEffect(() => {
    if (!enabled || !targetId) return;
    void trackView(targetId, {
      creatorId: options?.creatorId,
      viewerUserId: options?.viewerUserId,
    });
  }, [enabled, targetId, options?.creatorId, options?.viewerUserId]);

  useEffect(() => {
    if (!enabled || !targetId) return;
    const interval = setInterval(() => {
      void trackWatchTime(targetId, 30, {
        creatorId: options?.creatorId,
        viewerUserId: options?.viewerUserId,
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, [enabled, targetId, options?.creatorId, options?.viewerUserId]);
}
