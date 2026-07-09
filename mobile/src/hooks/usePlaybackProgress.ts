import { useEffect, useRef } from 'react';
import { postHistoryProgress } from '@/lib/api/history';

export function usePlaybackProgress(
  contentType: 'video' | 'podcast_episode' | 'vertical_episode',
  contentId: string | undefined,
  progressSeconds: number,
  durationSeconds: number,
  enabled: boolean,
) {
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled || !contentId || durationSeconds <= 0) return;
    const now = Math.floor(progressSeconds);
    if (now - lastSent.current < 10) return;
    lastSent.current = now;
    void postHistoryProgress({
      contentType,
      contentId,
      progressSeconds: now,
      completed: now / durationSeconds >= 0.92,
    }).catch(() => {});
  }, [contentType, contentId, progressSeconds, durationSeconds, enabled]);
}
