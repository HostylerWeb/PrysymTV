import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ContentCard } from '@/components/tv/ContentCard';
import { colors, spacing, typography } from '@/theme/tokens';
import type { VideoCard } from '@/types/api';

type Props = {
  title?: string;
  items: VideoCard[];
  onItemPress?: (item: VideoCard) => void;
  aspectRatio?: number;
  preferInitialFocus?: boolean;
};

export function ContentGrid({
  title,
  items,
  onItemPress,
  aspectRatio,
  preferInitialFocus = false,
}: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.heading}>{title}</Text> : null}
      <View style={styles.grid}>
        {items.map((item, index) => (
          <ContentCard
            key={item.id}
            title={item.title}
            thumbnailUrl={item.thumbnailUrl}
            subtitle={item.channel}
            aspectRatio={aspectRatio}
            layout="grid"
            hasTVPreferredFocus={preferInitialFocus && index === 0}
            onPress={() => onItemPress?.(item)}
          />
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
