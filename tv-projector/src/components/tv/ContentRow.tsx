import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '@/components/tv/ContentCard';
import { colors, spacing, typography } from '@/theme/tokens';
import type { VideoCard } from '@/types/api';

type Props = {
  title: string;
  items: VideoCard[];
  onItemPress?: (item: VideoCard) => void;
  aspectRatio?: number;
};

export function ContentRow({ title, items, onItemPress, aspectRatio }: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item, index) => (
          <ContentCard
            key={item.id}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            subtitle={item.channel}
            hasTVPreferredFocus={index === 0}
            aspectRatio={aspectRatio}
            onPress={() => onItemPress?.(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  heading: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
