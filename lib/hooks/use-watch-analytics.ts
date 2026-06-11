"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { trackView, trackWatchTime } from "@/lib/api/analytics";

type UseWatchAnalyticsOptions = {
  creatorId?: string;
  enabled?: boolean;
};

/** Tracks a view on mount and sends watch_time heartbeats every 30 seconds. */
export function useWatchAnalytics(
  targetId: string | undefined,
  options?: UseWatchAnalyticsOptions,
) {
  const { user } = useAuth();
  const enabled = options?.enabled !== false && !!targetId;

  useEffect(() => {
    if (!enabled || !targetId) return;
    void trackView(targetId, {
      creatorId: options?.creatorId,
      viewerUserId: user?.id,
    });
  }, [enabled, targetId, options?.creatorId, user?.id]);

  useEffect(() => {
    if (!enabled || !targetId) return;
    const interval = setInterval(() => {
      void trackWatchTime(targetId, 30, {
        creatorId: options?.creatorId,
        viewerUserId: user?.id,
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, [enabled, targetId, options?.creatorId, user?.id]);
}
