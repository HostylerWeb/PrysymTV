import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { VideoContentFit } from 'expo-video';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { watchDebug, watchDebugUrl } from '@/lib/watch-debug';
import { colors, spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  playbackUrl?: string | null;
  subtitle?: string;
  immersive?: boolean;
  autoPlay?: boolean;
  posterUrl?: string | null;
  contentFit?: VideoContentFit;
  onProgress?: (seconds: number, duration: number) => void;
  onPlaying?: () => void;
  debugLabel?: string;
};

export function PlayerShell({
  title,
  playbackUrl,
  subtitle,
  immersive = true,
  autoPlay = true,
  posterUrl,
  contentFit = 'contain',
  onProgress,
  onPlaying,
  debugLabel = 'shell',
}: Props) {
  const [videoReady, setVideoReady] = useState(false);
  const label = debugLabel;

  useEffect(() => {
    watchDebug('shell.mount', {
      label,
      title,
      playbackUrl: watchDebugUrl(playbackUrl),
      posterUrl: watchDebugUrl(posterUrl),
      autoPlay,
      immersive,
    });
    return () => watchDebug('shell.unmount', { label });
  }, [label, title, playbackUrl, posterUrl, autoPlay, immersive]);

  useEffect(() => {
    setVideoReady(false);
    watchDebug('shell.playbackUrlChange', {
      label,
      playbackUrl: watchDebugUrl(playbackUrl),
      videoReadyReset: true,
    });
  }, [playbackUrl, label]);

  useEffect(() => {
    if (posterUrl) void Image.prefetch(posterUrl);
  }, [posterUrl]);

  const handleFirstFrame = () => {
    watchDebug('shell.firstFrame', { label });
    setVideoReady(true);
    onPlaying?.();
  };

  const trackFirstFrame = Boolean(posterUrl || onPlaying);
  const showPoster = Boolean(posterUrl && !videoReady);
  const imageFit = contentFit === 'cover' ? 'cover' : 'contain';

  useEffect(() => {
    watchDebug('shell.ui', {
      label,
      trackFirstFrame,
      showPoster,
      videoReady,
      autoPlay,
    });
  }, [label, trackFirstFrame, showPoster, videoReady, autoPlay]);

  const posterOverlay =
    showPoster ? (
      <Image
        source={{ uri: posterUrl! }}
        style={styles.posterOverlay}
        contentFit={imageFit}
        transition={0}
        onLoad={() => watchDebug('shell.poster.load', { label })}
        onError={() => watchDebug('shell.poster.error', { label })}
      />
    ) : null;

  const player = playbackUrl ? (
    <HlsPlayer
      source={playbackUrl}
      nativeControls
      fill
      autoPlay={autoPlay}
      contentFit={contentFit}
      onProgress={onProgress}
      onReady={handleFirstFrame}
      hideUntilReady={trackFirstFrame}
      debugLabel={`${label}/hls`}
    />
  ) : (
    <View style={styles.unavailable}>
      <Text style={styles.unavailableText}>Playback unavailable</Text>
    </View>
  );

  if (immersive) {
    return (
      <View style={styles.immersive}>
        {player}
        {posterOverlay}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.inlinePlayer}>
        {player}
        {posterOverlay}
      </View>
      <View style={styles.meta}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  immersive: {
    flex: 1,
    backgroundColor: colors.videoBackground,
  },
  inlinePlayer: {
    flex: 1,
    backgroundColor: colors.videoBackground,
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: Platform.OS === 'android' ? 10 : 0,
    backgroundColor: colors.videoBackground,
  },
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  unavailable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.videoBackground,
  },
  unavailableText: {
    color: colors.mutedForeground,
    fontSize: typography.body,
  },
  meta: {
    padding: spacing.lg,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
});
