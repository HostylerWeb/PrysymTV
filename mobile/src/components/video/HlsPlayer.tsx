import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, withAlpha } from '@/theme/tokens';

type Props = {
  source: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
  contentFit?: 'contain' | 'cover' | 'fill';
  aspectRatio?: number;
  fill?: boolean;
};

export function HlsPlayer({
  source,
  autoPlay = true,
  loop = false,
  muted = false,
  onProgress,
  onEnded,
  contentFit = 'contain',
  aspectRatio = 16 / 9,
  fill = false,
}: Props) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = loop;
    p.muted = muted;
    p.timeUpdateEventInterval = 5;
    if (autoPlay) p.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

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
    if (player.playing) player.pause();
    else player.play();
  };

  return (
    <Pressable
      style={[styles.wrap, fill ? StyleSheet.absoluteFillObject : { aspectRatio }]}
      onPress={togglePlay}
    >
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit={contentFit}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
      />
      {!player.playing ? (
        <View style={styles.overlay} pointerEvents="none">
          <Ionicons name="play-circle" size={72} color={withAlpha(colors.onVideo, 0.85)} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: colors.videoBackground,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha('#000', 0.2),
  },
});
