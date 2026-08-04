import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeLiveFeed } from '@/lib/api/live-feed-socket';

/** Invalidate home/videos feeds when a stream goes live or ends (WebSocket push). */
export function useLiveFeedUpdates(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    return subscribeLiveFeed(() => {
      void queryClient.invalidateQueries({ queryKey: ['feed', 'home'] });
      void queryClient.invalidateQueries({ queryKey: ['videos', 'browse'] });
      void queryClient.invalidateQueries({ queryKey: ['streams', 'live'] });
    });
  }, [enabled, queryClient]);
}
