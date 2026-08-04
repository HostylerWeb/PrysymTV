import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import type { LiveBroadcastPlayerProps } from '@/components/live/LiveBroadcastPlayer.types';
import { colors } from '@/theme/tokens';

/** Expo web: HLS only (native app uses WebRTC via WebView). */
export function LiveBroadcastPlayer({
  hlsUrl,
  posterUrl,
  contentFit = 'cover',
  paused = false,
  autoPlay = true,
  isLive = true,
}: LiveBroadcastPlayerProps) {
  const hls = hlsUrl?.trim() ?? '';

  if (!hls) {
    return (
      <View style={styles.wrap}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
        ) : (
          <View style={styles.poster} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <HlsPlayer
        source={hls}
        posterUrl={posterUrl}
        contentFit={contentFit}
        autoPlay={autoPlay && !paused}
        paused={paused}
        isLive={isLive}
        nativeControls={false}
        tapToToggle={false}
        enablePlayerChrome={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.videoBackground,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.secondary,
  },
});
