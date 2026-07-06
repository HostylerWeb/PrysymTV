import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SectionHeader } from '@/components/home/SectionHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';
import { commonStyles } from '@/theme/styles';
import { formatDuration } from '@/utils/format-media';
import type { ContinueWatchingItem } from '@/types/api';

export function ContinueWatchingRow({ items }: { items: ContinueWatchingItem[] }) {
  const router = useRouter();
  if (!items.length) return null;

  return (
    <View style={[styles.wrap, commonStyles.sectionDivider]}>
      <SectionHeader title="Continue watching" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {items.map((item) => (
          <Pressable
            key={item.contentId}
            style={styles.card}
            onPress={() => {
              if (item.contentType === 'video') router.push(`/watch/${item.contentId}`);
              else if (item.contentType === 'podcast_episode') router.push(`/podcast/${item.contentId}`);
              else router.push(`/verticals/watch/${item.seriesSlug ?? 'series-1'}/5`);
            }}
          >
            <View style={styles.thumbWrap}>
              <Image source={{ uri: item.thumbnailUrl ?? '' }} style={styles.thumb} contentFit="cover" />
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progress,
                    { width: `${(item.progressSeconds / item.durationSeconds) * 100}%` },
                  ]}
                />
              </View>
            </View>
            <ThemedText variant="caption" style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </ThemedText>
            <ThemedText variant="micro" muted>
              {formatDuration(item.durationSeconds - item.progressSeconds)} left
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  scroll: { paddingHorizontal: spacing.page, gap: spacing.md },
  card: { width: 176 },
  thumbWrap: {
    width: 176,
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.6),
  },
  thumb: { width: '100%', height: '100%' },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: colors.muted,
  },
  progress: { height: '100%', backgroundColor: colors.primary },
  cardTitle: { marginTop: 8 },
});
