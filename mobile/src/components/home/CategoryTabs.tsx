import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { FilterChip } from '@/components/ui/FilterChip';
import { spacing } from '@/theme/tokens';

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
      {CATEGORIES.map((c) => (
        <FilterChip
          key={c.id}
          label={c.label}
          active={active === c.id}
          variant="soft"
          onPress={() => onChange(c.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
