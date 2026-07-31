import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  fetchServedAd,
  isValidServedAd,
  type AdPlacement,
  type ServedAd,
} from '@/lib/api/ads';
import { useShouldShowAds } from '@/hooks/useShouldShowAds';
import { watchDebug } from '@/lib/watch-debug';

type GateState = 'idle' | 'checking' | 'show_ad' | 'skip';

const adPeekQueryKey = (placement: AdPlacement) => ['ad', 'peek', placement];

/**
 * Spinner-first preroll gate:
 * - Peek runs immediately on mount while the UI shows a spinner.
 * - No ad → release playback right away.
 * - Ad found → show overlay, then release playback after completeAd().
 */
export function useTvAdGate(
  placement: AdPlacement,
  contentKey?: string | null,
  enabled = true,
) {
  const shouldShow = useShouldShowAds();
  const queryClient = useQueryClient();
  const [state, setState] = useState<GateState>('idle');
  const [servedAd, setServedAd] = useState<ServedAd | null>(null);
  const [adFinished, setAdFinished] = useState(false);
  const resolvedKeyRef = useRef<string | null>(null);
  const peekStartedAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || !contentKey) {
      watchDebug('adGate.skip', { reason: 'disabled_or_no_key', placement, contentKey });
      setState('skip');
      setServedAd(null);
      resolvedKeyRef.current = null;
      return;
    }

    if (!shouldShow) {
      watchDebug('adGate.skip', { reason: 'should_not_show', placement, contentKey });
      setState('skip');
      setServedAd(null);
      resolvedKeyRef.current = contentKey;
      return;
    }

    if (resolvedKeyRef.current === contentKey) {
      return;
    }

    setAdFinished(false);
    setServedAd(null);
    resolvedKeyRef.current = contentKey;
    peekStartedAtRef.current = Date.now();
    setState('checking');
    watchDebug('adGate.checking', { placement, contentKey });

    let cancelled = false;

    const cachedPeek = queryClient.getQueryData<ServedAd | null>(
      adPeekQueryKey(placement),
    );
    const peekPromise =
      cachedPeek !== undefined
        ? Promise.resolve(cachedPeek)
        : queryClient.fetchQuery({
            queryKey: adPeekQueryKey(placement),
            queryFn: () => fetchServedAd(placement, { peek: true }),
            staleTime: 30_000,
          });

    void peekPromise
      .then((peek) => {
        if (cancelled) return;
        const elapsedMs = Date.now() - peekStartedAtRef.current;
        const valid = isValidServedAd(peek);
        watchDebug('adGate.peekResult', {
          placement,
          contentKey,
          elapsedMs,
          valid,
          adId: valid ? peek.id : null,
          fromCache: cachedPeek !== undefined,
        });

        if (!valid) {
          setServedAd(null);
          setState('skip');
          return;
        }

        setServedAd(peek);
        setAdFinished(false);
        setState('show_ad');
      })
      .catch((err) => {
        if (cancelled) return;
        watchDebug('adGate.peekError', {
          placement,
          contentKey,
          elapsedMs: Date.now() - peekStartedAtRef.current,
          error: String(err),
        });
        setServedAd(null);
        setState('skip');
      });

    return () => {
      cancelled = true;
    };
  }, [placement, contentKey, enabled, shouldShow, queryClient]);

  useEffect(() => {
    watchDebug('adGate.state', {
      placement,
      contentKey,
      state,
      adFinished,
      showOverlay: state === 'show_ad' && !adFinished,
    });
  }, [placement, contentKey, state, adFinished]);

  const completeAd = () => {
    watchDebug('adGate.complete', { placement, contentKey });
    setAdFinished(true);
  };

  const showOverlay = state === 'show_ad' && !adFinished;
  const checking = state === 'checking' || state === 'idle';
  const canPlay = !checking && !showOverlay;

  return {
    checking,
    showOverlay,
    canPlay,
    servedAd,
    completeAd,
  };
}
