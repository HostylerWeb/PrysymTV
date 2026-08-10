import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView, type VideoContentFit } from 'expo-video';
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
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const reportedReadyRef = useRef(false);
  const wasReadyRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  const onReadyRef = useRef(onReady);
  onProgressRef.current = onProgress;
  onReadyRef.current = onReady;

  const player = useVideoPlayer(
    { uri: source, contentType: source.includes('.m3u8') ? 'hls' : 'auto' },
    (p) => {
      p.loop = false;
      p.muted = false;
      p.timeUpdateEventInterval = 1;
    },
  );

  useEffect(() => {
    reportedReadyRef.current = false;
    wasReadyRef.current = false;
    setPlaying(false);
    setBuffering(true);
  }, [source]);

  useEffect(() => {
    if (autoPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [autoPlay, player, source]);

  const reportReady = () => {
    if (!reportedReadyRef.current) {
      reportedReadyRef.current = true;
      wasReadyRef.current = true;
      onReadyRef.current?.();
    }
  };

  useEffect(() => {
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      setPlaying(isPlaying);
      if (isPlaying) {
        setBuffering(false);
        if (hideUntilReady && player.currentTime >= 0.15) reportReady();
      }
    });
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'loading') {
        // After first ready, brief rebuffer during seek should not flash UI.
        if (!wasReadyRef.current) setBuffering(true);
      } else if (status === 'readyToPlay') {
        setBuffering(false);
      }
    });
    return () => {
      playingSub.remove();
      statusSub.remove();
    };
  }, [player, hideUntilReady]);

  useEffect(() => {
    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      if (hideUntilReady && player.playing && currentTime >= 0.15) {
        reportReady();
      }
      onProgressRef.current?.(currentTime, player.duration);
    });
    return () => sub.remove();
  }, [player, hideUntilReady]);

  const showLoading = !nativeControls && buffering && !playing && !wasReadyRef.current;
  const posterMode = hideUntilReady;
  const androidPosterMode = Platform.OS === 'android' && posterMode;

  const handleFirstFrame = () => {
    if (!hideUntilReady && player.playing) {
      reportReady();
    }
  };

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
