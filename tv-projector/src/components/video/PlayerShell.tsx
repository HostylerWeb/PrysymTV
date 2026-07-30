import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HlsPlayer } from '@/components/video/HlsPlayer';
import { colors, spacing, typography } from '@/theme/tokens';

type Props = {
  title: string;
  playbackUrl?: string | null;
  subtitle?: string;
  onProgress?: (seconds: number, duration: number) => void;
};

export function PlayerShell({ title, playbackUrl, subtitle, onProgress }: Props) {
  return (
    <View style={styles.wrap}>
      {playbackUrl ? (
        <HlsPlayer source={playbackUrl} nativeControls onProgress={onProgress} />
      ) : (
        <View style={styles.unavailable}>
          <Text style={styles.unavailableText}>Playback unavailable</Text>
        </View>
      )}
      <View style={styles.meta}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
