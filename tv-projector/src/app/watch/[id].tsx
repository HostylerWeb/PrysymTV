import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TvAdOverlay } from '@/components/ads/TvAdOverlay';
import { PlayerShell } from '@/components/video/PlayerShell';
import { useVideoDetail, resolveVideoPlayback } from '@/hooks/api/useVideoDetail';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useTvAdGate } from '@/hooks/useTvAdGate';
import { watchDebug, watchDebugReset, watchDebugUrl } from '@/lib/watch-debug';
import { colors } from '@/theme/tokens';

export default function WatchScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    thumbnailUrl?: string;
  }>();

  const videoQuery = useVideoDetail(params.id);
  const detail = videoQuery.data;

  const [progressSeconds, setProgressSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [videoVisible, setVideoVisible] = useState(false);

  const adGate = useTvAdGate('movie_preroll', params.id, Boolean(params.id));

  const playbackUrl = useMemo(() => resolveVideoPlayback(detail), [detail]);

  const title = detail?.title ?? params.title ?? 'Watch';

  useEffect(() => {
    watchDebugReset(`watch_mount:${params.id}`);
    watchDebug('watch.mount', {
      id: params.id,
      title: params.title,
      thumbnailParam: watchDebugUrl(params.thumbnailUrl),
    });
    return () => watchDebug('watch.unmount', { id: params.id });
  }, [params.id, params.title, params.thumbnailUrl]);

  useEffect(() => {
    watchDebug('watch.query', {
      id: params.id,
      isLoading: videoQuery.isLoading,
      isFetching: videoQuery.isFetching,
      isError: videoQuery.isError,
      hasData: Boolean(detail),
      status: videoQuery.status,
      fetchStatus: videoQuery.fetchStatus,
    });
  }, [
    params.id,
    videoQuery.isLoading,
    videoQuery.isFetching,
    videoQuery.isError,
    videoQuery.status,
    videoQuery.fetchStatus,
    detail,
  ]);

  useEffect(() => {
    watchDebug('watch.playbackUrl', {
      id: params.id,
      hasUrl: Boolean(playbackUrl),
      url: watchDebugUrl(playbackUrl),
    });
  }, [params.id, playbackUrl]);

  useEffect(() => {
    setVideoVisible(false);
  }, [params.id]);

  useEffect(() => {
    if (detail?.durationSeconds) {
      setDurationSeconds(detail.durationSeconds);
    }
  }, [detail?.durationSeconds]);

  useEffect(() => {
    if (adGate.showOverlay) setVideoVisible(false);
  }, [adGate.showOverlay]);

  usePlaybackProgress(
    'video',
    params.id,
    progressSeconds,
    durationSeconds,
    adGate.canPlay && Boolean(playbackUrl) && videoVisible,
  );

  const canMountPlayer = Boolean(playbackUrl) && !adGate.checking;
  const shouldPlay = canMountPlayer && adGate.canPlay;
  const showSpinner =
    adGate.checking || !playbackUrl || (!videoVisible && !adGate.showOverlay);

  useEffect(() => {
    watchDebug('watch.adGate', {
      checking: adGate.checking,
      showOverlay: adGate.showOverlay,
      canPlay: adGate.canPlay,
      shouldPlay,
      hasServedAd: Boolean(adGate.servedAd),
    });
  }, [adGate.checking, adGate.showOverlay, adGate.canPlay, adGate.servedAd, shouldPlay]);

  useEffect(() => {
    watchDebug('watch.ui', {
      showSpinner,
      videoVisible,
      mountPlayerShell: canMountPlayer,
    });
  }, [showSpinner, videoVisible, canMountPlayer]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />
      <TvAdOverlay
        visible={adGate.showOverlay}
        placement="movie_preroll"
        videoId={params.id}
        creatorId={detail?.creator?.id}
        servedAd={adGate.servedAd}
        onComplete={adGate.completeAd}
      />
      {canMountPlayer ? (
        <View
          style={[styles.playerSlot, !videoVisible ? styles.playerHidden : null]}
          pointerEvents={videoVisible && !adGate.showOverlay ? 'auto' : 'none'}
        >
          <PlayerShell
            title={title}
            playbackUrl={playbackUrl!}
            autoPlay={shouldPlay}
            debugLabel="watch"
            onProgress={(seconds, duration) => {
              setProgressSeconds(seconds);
              if (duration > 0) setDurationSeconds(duration);
              if (adGate.canPlay && seconds >= 0.15) {
                watchDebug('watch.playbackProgress.visible', {
                  id: params.id,
                  seconds,
                });
                setVideoVisible(true);
              }
            }}
          />
        </View>
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
  playerSlot: {
    flex: 1,
  },
  playerHidden: {
    opacity: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.videoBackground,
    zIndex: 30,
    elevation: 30,
  },
});
