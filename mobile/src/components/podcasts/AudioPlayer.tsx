import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: source },
        { shouldPlay: autoPlay },
        (status) => {
          if (!status.isLoaded || !mounted) return;
          setPlaying(status.isPlaying);
          const secs = (status.positionMillis ?? 0) / 1000;
          setPosition(secs);
          onProgress?.(secs);
        },
      );
      soundRef.current = sound;
    })();
    return () => {
      mounted = false;
      void soundRef.current?.unloadAsync();
    };
  }, [source, autoPlay, onProgress]);

  const toggle = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) await sound.pauseAsync();
    else await sound.playAsync();
  };

  const seek = async (delta: number) => {
    const sound = soundRef.current;
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    const next = Math.max(0, Math.min((status.positionMillis ?? 0) / 1000 + delta, durationSeconds));
    await sound.setPositionAsync(next * 1000);
  };

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
        <Pressable style={styles.ctrlBtn} onPress={() => void seek(-15)}>
          <Text style={styles.ctrlText}>15s</Text>
        </Pressable>
        <Pressable style={styles.playBtn} onPress={() => void toggle()}>
          <Ionicons name={playing ? 'pause' : 'play'} size={24} color={colors.primaryForeground} />
        </Pressable>
        <Pressable style={styles.ctrlBtn} onPress={() => void seek(15)}>
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
