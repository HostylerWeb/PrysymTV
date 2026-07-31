import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';
import { watchDebug, watchDebugUrl } from '@/lib/watch-debug';
import { colors } from '@/theme/tokens';

type Props = {
  source: string;
  autoPlay?: boolean;
  nativeControls?: boolean;
  fill?: boolean;
  contentFit?: VideoContentFit;
  onProgress?: (seconds: number, duration: number) => void;
  onReady?: () => void;
  hideUntilReady?: boolean;
  debugLabel?: string;
};

export function HlsPlayer({
  source,
  autoPlay = true,
  nativeControls = true,
  fill = true,
  contentFit = 'contain',
  onProgress,
  onReady,
  hideUntilReady = false,
  debugLabel = 'player',
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const reportedReadyRef = useRef(false);
  const timeUpdateCountRef = useRef(0);
  const label = debugLabel;

  const player = useVideoPlayer(
    { uri: source, contentType: source.includes('.m3u8') ? 'hls' : 'auto' },
    (p) => {
      p.loop = false;
      p.muted = false;
      p.timeUpdateEventInterval = 0.5;
      watchDebug('hls.player.init', {
        label,
        source: watchDebugUrl(source),
        status: p.status,
        playing: p.playing,
      });
    },
  );

  useEffect(() => {
    watchDebug('hls.mount', {
      label,
      source: watchDebugUrl(source),
      autoPlay,
      hideUntilReady,
      nativeControls,
      contentFit,
    });
    return () => watchDebug('hls.unmount', { label, source: watchDebugUrl(source) });
  }, [label, source, autoPlay, hideUntilReady, nativeControls, contentFit]);

  useEffect(() => {
    reportedReadyRef.current = false;
    timeUpdateCountRef.current = 0;
    setPlaying(false);
    setBuffering(true);
    watchDebug('hls.sourceChange', { label, source: watchDebugUrl(source) });
  }, [label, source]);

  useEffect(() => {
    watchDebug('hls.autoPlay', {
      label,
      autoPlay,
      playerStatus: player.status,
      playerPlaying: player.playing,
    });
    if (autoPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [autoPlay, player, source, label]);

  const reportReady = () => {
    if (!reportedReadyRef.current) {
      reportedReadyRef.current = true;
      onReady?.();
    }
  };

  useEffect(() => {
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      watchDebug('hls.playingChange', {
        label,
        isPlaying,
        status: player.status,
        currentTime: player.currentTime,
        duration: player.duration,
      });
      setPlaying(isPlaying);
      if (isPlaying) {
        setBuffering(false);
        if (hideUntilReady && player.currentTime >= 0.15) reportReady();
      }
    });
    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      watchDebug('hls.statusChange', {
        label,
        status,
        error: error ? String(error.message ?? error) : null,
        playing: player.playing,
        currentTime: player.currentTime,
        duration: player.duration,
      });
      if (status === 'loading') {
        setBuffering(true);
      } else if (status === 'readyToPlay') {
        setBuffering(false);
      }
    });
    const playToEndSub = player.addListener('playToEnd', () => {
      watchDebug('hls.playToEnd', { label });
    });
    return () => {
      playingSub.remove();
      statusSub.remove();
      playToEndSub.remove();
    };
  }, [player, label]);

  useEffect(() => {
    if (!onProgress) return;
    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      timeUpdateCountRef.current += 1;
      if (hideUntilReady && player.playing && currentTime >= 0.15) {
        reportReady();
      }
      if (timeUpdateCountRef.current <= 5 || timeUpdateCountRef.current % 10 === 0) {
        watchDebug('hls.timeUpdate', {
          label,
          count: timeUpdateCountRef.current,
          currentTime,
          duration: player.duration,
          playing: player.playing,
          status: player.status,
        });
      }
      onProgress(currentTime, player.duration);
    });
    return () => sub.remove();
  }, [player, onProgress, label]);

  const showLoading = !nativeControls && buffering && !playing;
  const posterMode = hideUntilReady;
  const androidPosterMode = Platform.OS === 'android' && posterMode;

  const handleFirstFrame = () => {
    watchDebug('hls.onFirstFrameRender', {
      label,
      alreadyReported: reportedReadyRef.current,
      status: player.status,
      playing: player.playing,
      currentTime: player.currentTime,
    });
    // Only trust first-frame when actually playing; paused preload fires too early.
    if (!hideUntilReady && player.playing) {
      reportReady();
    }
  };

  useEffect(() => {
    watchDebug('hls.surface', {
      label,
      posterMode,
      androidPosterMode,
      surfaceType: androidPosterMode ? 'textureView' : 'surfaceView',
      useExoShutter: false,
    });
  }, [label, posterMode, androidPosterMode]);

  return (
    <View style={[styles.wrap, fill ? styles.fill : null]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit={contentFit}
        nativeControls={nativeControls}
        allowsPictureInPicture={false}
        surfaceType={androidPosterMode ? 'textureView' : 'surfaceView'}
        useExoShutter={false}
        onFirstFrameRender={posterMode ? handleFirstFrame : undefined}
      />
      {showLoading ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: colors.videoBackground,
  },
  fill: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
