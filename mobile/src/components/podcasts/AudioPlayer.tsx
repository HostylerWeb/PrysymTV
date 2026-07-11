import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme/tokens';
import { formatDuration } from '@/utils/format-media';

type Props = {
  source: string;
  title: string;
  durationSeconds: number;
  onProgress?: (seconds: number) => void;
  autoPlay?: boolean;
};

export function AudioPlayer({ source, title, durationSeconds, onProgress, autoPlay = false }: Props) {
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
        <Pressable style={styles.ctrlBtn} onPress={() => seek(-15)}>
          <Text style={styles.ctrlText}>15s</Text>
        </Pressable>
        <Pressable style={styles.playBtn} onPress={toggle}>
          <Ionicons name={status.playing ? 'pause' : 'play'} size={24} color={colors.primaryForeground} />
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={() => seek(15)}>
          <Text style={styles.ctrlText}>15s</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24, alignItems: 'center', gap: 12 },
  title: { color: colors.foreground, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  track: { width: '100%', height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  time: { color: colors.mutedForeground, fontSize: 12 },
  controls: { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
  ctrlBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  ctrlText: { color: colors.foreground, fontWeight: '600', fontSize: 12 },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
