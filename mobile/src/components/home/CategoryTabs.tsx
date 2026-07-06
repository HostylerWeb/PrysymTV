import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

export type HomeCategory = 'all' | 'movies' | 'live' | 'videos' | 'series' | 'trending';

const CATEGORIES: { id: HomeCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'movies', label: 'Movies' },
  { id: 'live', label: 'Live' },
  { id: 'videos', label: 'Videos' },
  { id: 'series', label: 'Series' },
  { id: 'trending', label: 'Trending' },
];

type Props = {
  active: HomeCategory;
  onChange: (c: HomeCategory) => void;
};

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((c) => {
        const isActive = active === c.id;
        return (
          <Pressable
            key={c.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onChange(c.id)}
          >
            <ThemedText
              variant="bodyMedium"
              primary={isActive}
              muted={!isActive}
              style={isActive ? styles.textActive : undefined}
            >
              {c.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: withAlpha(colors.secondary, 0.6),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: withAlpha(colors.primary, 0.1),
    borderColor: withAlpha(colors.primary, 0.35),
  },
  textActive: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
