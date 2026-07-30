import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, spacing, typography } from '@/theme/tokens';
import { formatDuration } from '@/utils/format-media';

type Props = {
  source: string;
  title: string;
  durationSeconds: number;
  onProgress?: (seconds: number) => void;
  autoPlay?: boolean;
};

export function AudioPlayer({
  source,
  title,
  durationSeconds,
  onProgress,
  autoPlay = false,
}: Props) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (autoPlay) player.play();
  }, [autoPlay, player, source]);

  useEffect(() => {
    if (status.currentTime != null) {
      onProgress?.(status.currentTime);
    }
  }, [status.currentTime, onProgress]);

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const seek = (delta: number) => {
    const next = Math.max(0, Math.min((status.currentTime ?? 0) + delta, durationSeconds));
    player.seekTo(next);
  };

  const position = status.currentTime ?? 0;
  const progress = durationSeconds > 0 ? position / durationSeconds : 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>
      <Text style={styles.time}>
        {formatDuration(position)} / {formatDuration(durationSeconds)}
      </Text>
      <View style={styles.controls}>
        <Pressable focusable style={styles.ctrlBtn} onPress={() => seek(-15)}>
          <Text style={styles.ctrlText}>-15s</Text>
        </Pressable>
        <Pressable focusable hasTVPreferredFocus style={styles.playBtn} onPress={toggle}>
          <Text style={styles.playText}>{status.playing ? 'Pause' : 'Play'}</Text>
        </Pressable>
        <Pressable focusable style={styles.ctrlBtn} onPress={() => seek(15)}>
          <Text style={styles.ctrlText}>+15s</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  track: {
    width: '100%',
    maxWidth: 640,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  time: { color: colors.mutedForeground, fontSize: typography.caption },
  controls: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, alignItems: 'center' },
  ctrlBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ctrlText: { color: colors.foreground, fontSize: typography.body, fontWeight: '600' },
  playBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playText: { color: colors.foreground, fontSize: typography.body, fontWeight: '700' },
});
