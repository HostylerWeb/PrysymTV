import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, withAlpha } from '@/theme/tokens';

type Props = {
  source: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  /** When true, uses platform native controls. Shorts should keep this false. */
  nativeControls?: boolean;
  /** When false, tap does not toggle play (parent can own gestures). */
  tapToToggle?: boolean;
  posterUrl?: string | null;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
  contentFit?: 'contain' | 'cover' | 'fill';
  aspectRatio?: number;
  fill?: boolean;
  /** Pause/resume from outside (e.g. tab blur). */
  paused?: boolean;
};

export function HlsPlayer({
  source,
  autoPlay = true,
  loop = false,
  muted = false,
  nativeControls = false,
  tapToToggle = true,
  onProgress,
  onEnded,
  contentFit = 'contain',
  aspectRatio = 16 / 9,
  fill = false,
  paused = false,
}: Props) {
  const [playing, setPlaying] = useState(autoPlay && !paused);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  const player = useVideoPlayer(source, (p) => {
    p.loop = loop;
    p.muted = muted;
    p.timeUpdateEventInterval = 0.5;
    if (autoPlay && !paused) p.play();
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    player.loop = loop;
  }, [player, loop]);

  const shouldPlay = autoPlay && !paused && appActive;

  useEffect(() => {
    if (!shouldPlay) {
      player.pause();
      setPlaying(false);
      return;
    }
    player.play();
  }, [player, shouldPlay]);

  useEffect(() => {
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      setPlaying(isPlaying);
      if (isPlaying) {
        setReady(true);
        setBuffering(false);
      }
    });
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') {
        setReady(true);
        setBuffering(false);
      } else if (status === 'loading') {
        setBuffering(true);
      }
    });
    return () => {
      playingSub.remove();
      statusSub.remove();
    };
  }, [player]);

  useEffect(() => {
    if (!onProgress) return;
    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      onProgress(currentTime, player.duration);
    });
    return () => sub.remove();
  }, [player, onProgress]);

  useEffect(() => {
    if (!onEnded) return;
    const sub = player.addListener('playToEnd', () => onEnded());
    return () => sub.remove();
  }, [player, onEnded]);

  const togglePlay = () => {
    if (!tapToToggle || nativeControls) return;
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  };

  const showLoading = (!ready || buffering) && !playing;
  const showPausedOverlay = !nativeControls && ready && !playing && !buffering;

  return (
    <View style={[styles.wrap, fill ? StyleSheet.absoluteFillObject : { aspectRatio }]}>
      <VideoView
        style={[StyleSheet.absoluteFill, { opacity: ready ? 1 : 0 }]}
        player={player}
        contentFit={contentFit}
        allowsFullscreen
        allowsPictureInPicture={false}
        nativeControls={nativeControls}
        pointerEvents={nativeControls ? 'auto' : 'none'}
      />
      {showLoading ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={withAlpha(colors.onVideo, 0.9)} />
        </View>
      ) : null}
      {showPausedOverlay ? (
        <View style={styles.overlay} pointerEvents="none">
          <Ionicons name="play-circle" size={72} color={withAlpha(colors.onVideo, 0.85)} />
        </View>
      ) : null}
      {!nativeControls && tapToToggle ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={togglePlay} accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#000', 0.15),
  },
});
