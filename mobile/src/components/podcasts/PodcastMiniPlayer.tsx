import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CastMediaButton } from '@/components/video/CastMediaButton';
import { usePodcastPlayer } from '@/context/PodcastPlayerContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { colors, radius, withAlpha } from '@/theme/tokens';
import { formatDuration } from '@/utils/format-media';

export function PodcastMiniPlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const { episode, playing, progress, muted, togglePlay, toggleMute, stop } = usePodcastPlayer();

  if (!episode) return null;

  return (
    <View style={[styles.wrap, { bottom: tabInset + 8, marginBottom: insets.bottom > 0 ? 0 : 4 }]}>
      <Pressable style={styles.main} onPress={() => router.push(`/podcast/${episode.id}`)}>
        <Image source={{ uri: episode.coverUrl ?? '' }} style={styles.cover} contentFit="cover" />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{episode.title}</Text>
          <Text style={styles.sub}>{episode.showTitle}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      </Pressable>
      <Pressable onPress={toggleMute} hitSlop={8} style={styles.iconBtn}>
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color={colors.foreground} />
      </Pressable>
      <CastMediaButton variant="compact" />
      <Pressable onPress={togglePlay} hitSlop={8} style={styles.playBtn}>
        <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.primaryForeground} />
      </Pressable>
      <Pressable onPress={stop} hitSlop={8} style={styles.iconBtn}>
        <Ionicons name="close" size={20} color={colors.mutedForeground} />
      </Pressable>
      <Text style={styles.time}>{formatDuration(Math.floor((episode.durationSeconds ?? 0) * progress))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.card, 0.98),
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 50,
    elevation: 8,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cover: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.secondary },
  meta: { flex: 1 },
  title: { color: colors.foreground, fontSize: 13, fontWeight: '700' },
  sub: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
  progressTrack: { height: 3, backgroundColor: colors.secondary, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  iconBtn: { padding: 4 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { position: 'absolute', right: 12, bottom: 4, color: colors.mutedForeground, fontSize: 9 },
});
