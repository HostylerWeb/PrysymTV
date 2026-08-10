import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { TvAdOverlay } from '@/components/ads/TvAdOverlay';
import { PlayerShell } from '@/components/video/PlayerShell';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useTvAdGate } from '@/hooks/useTvAdGate';
import type { AdPlacement } from '@/lib/api/ads';
import { colors } from '@/theme/tokens';

type ContentType = 'video' | 'vertical_episode';

type Props = {
  contentId: string | null | undefined;
  playbackUrl: string | null | undefined;
  title: string;
  subtitle?: string;
  posterUrl?: string | null;
  adPlacement: AdPlacement;
  creatorId?: string;
  contentType?: ContentType;
  durationSeconds?: number;
  contentFit?: 'contain' | 'cover';
};

/**
 * Mobile-style watch flow for TV:
 * 1) Spinner while ad peek runs
 * 2) Ad overlay on poster (main player NOT mounted — avoids decoder clash + blink)
 * 3) Single player instance after ad completes
 */
export function TvWatchPlayerLayout({
  contentId,
  playbackUrl,
  title,
  subtitle,
  posterUrl,
  adPlacement,
  creatorId,
  contentType = 'video',
  durationSeconds = 0,
  contentFit = 'contain',
}: Props) {
  const adGate = useTvAdGate(adPlacement, contentId, Boolean(contentId));
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [trackDuration, setTrackDuration] = useState(durationSeconds);
  const progressRef = useRef(0);
  const progressTickRef = useRef(0);

  useEffect(() => {
    setProgressSeconds(0);
    progressRef.current = 0;
    progressTickRef.current = 0;
  }, [contentId, playbackUrl]);

  useEffect(() => {
    if (durationSeconds > 0) setTrackDuration(durationSeconds);
  }, [durationSeconds]);

  const onProgress = useCallback((seconds: number, duration: number) => {
    progressTickRef.current += 1;
    const prev = progressRef.current;
    if (
      progressTickRef.current <= 2 ||
      progressTickRef.current % 4 === 0 ||
      Math.abs(seconds - prev) >= 2
    ) {
      progressRef.current = seconds;
      setProgressSeconds(seconds);
    }
    if (duration > 0) setTrackDuration(duration);
  }, []);

  const historyEnabled =
    adGate.canPlay && Boolean(playbackUrl) && Boolean(contentId) && trackDuration > 0;

  usePlaybackProgress(
    contentType,
    contentId ?? undefined,
    progressSeconds,
    trackDuration,
    historyEnabled,
  );

  const showSpinner = adGate.checking || !playbackUrl;
  const showAd = adGate.showOverlay && Boolean(playbackUrl);
  const showPlayer = adGate.canPlay && Boolean(playbackUrl);

  return (
    <View style={styles.root}>
      {posterUrl && (showAd || showSpinner) ? (
        <Image
          source={{ uri: posterUrl }}
          style={styles.poster}
          contentFit="cover"
          transition={0}
        />
      ) : null}

      {showAd ? (
        <TvAdOverlay
          inline
          visible
          placement={adPlacement}
          videoId={contentType === 'video' ? contentId ?? undefined : undefined}
          creatorId={creatorId}
          servedAd={adGate.servedAd}
          onComplete={adGate.completeAd}
        />
      ) : null}

      {showPlayer ? (
        <PlayerShell
          title={title}
          subtitle={subtitle}
          playbackUrl={playbackUrl!}
          posterUrl={posterUrl}
          autoPlay
          contentFit={contentFit}
          onProgress={onProgress}
        />
      ) : null}

      {showSpinner ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.videoBackground,
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.videoBackground,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.videoBackground,
    zIndex: 50,
    elevation: 50,
  },
});
