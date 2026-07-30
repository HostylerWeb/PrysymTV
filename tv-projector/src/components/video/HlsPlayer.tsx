import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '@/theme/tokens';

type Props = {
  source: string;
  autoPlay?: boolean;
  nativeControls?: boolean;
  onProgress?: (seconds: number, duration: number) => void;
};

export function HlsPlayer({
  source,
  autoPlay = true,
  nativeControls = true,
  onProgress,
}: Props) {
  const player = useVideoPlayer(
    { uri: source, contentType: source.includes('.m3u8') ? 'hls' : 'auto' },
    (p) => {
      p.loop = false;
      p.muted = false;
    },
  );

  useEffect(() => {
    if (autoPlay) {
      player.play();
    }
  }, [autoPlay, player, source]);

  useEffect(() => {
    if (!onProgress) return;
    const sub = player.addListener('timeUpdate', ({ currentTime }) => {
      onProgress(currentTime, player.duration);
    });
    return () => sub.remove();
  }, [player, onProgress]);

  return (
    <View style={styles.wrap}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="contain"
        nativeControls={nativeControls}
        allowsPictureInPicture={false}
      />
      {!player.playing ? (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.videoBackground,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
});
