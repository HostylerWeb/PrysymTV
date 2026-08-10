import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography } from '@/theme/tokens';
import type { ContinueWatchingItem } from '@/types/api';

type Props = {
  item: ContinueWatchingItem;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
};

function formatTimeLeft(seconds: number): string {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const secs = Math.max(0, Math.floor(seconds % 60));
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m left`;
  }
  return mins > 0 ? `${mins}m ${secs}s left` : `${secs}s left`;
}

export function ContinueWatchingCard({
  item,
  onPress,
  hasTVPreferredFocus,
}: Props) {
  const progress =
    item.durationSeconds > 0
      ? Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)
      : 0;
  const timeLeft = item.durationSeconds - item.progressSeconds;

  return (
    <Pressable
      focusable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      style={({ focused }) => [styles.card, focused && styles.cardFocused]}
    >
      <View style={styles.posterWrap}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.poster}
            contentFit="cover"
            recyclingKey={item.thumbnailUrl}
          />
        ) : (
          <View style={[styles.poster, styles.posterFallback]} />
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progress, { width: `${progress}%` }]} />
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {item.subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
      ) : null}
      {item.durationSeconds > 0 ? (
        <Text style={styles.timeLeft}>{formatTimeLeft(timeLeft)}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    marginRight: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 8,
  },
  cardFocused: {
    borderColor: colors.focus,
    backgroundColor: colors.secondary,
    transform: [{ scale: 1.05 }],
  },
  posterWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  poster: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  posterFallback: {
    backgroundColor: colors.border,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progress: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: 10,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
  timeLeft: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginTop: 4,
  },
});
