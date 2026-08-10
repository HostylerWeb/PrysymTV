import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { FilterChip } from '@/components/ui/FilterChip';
import { spacing } from '@/theme/tokens';
import type { ContentServicesSettings } from '@/lib/content-services';

export type HomeCategory = 'all' | 'movies' | 'live' | 'videos' | 'series' | 'trending';

const CATEGORIES: { id: HomeCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'movies', label: 'Movies' },
  { id: 'live', label: 'Live' },
  { id: 'videos', label: 'Videos' },
  { id: 'series', label: 'Series' },
  { id: 'trending', label: 'Trending' },
];

export function getVisibleHomeCategories(
  services: ContentServicesSettings,
): Array<{ id: HomeCategory; label: string }> {
  const categories: Array<{ id: HomeCategory; label: string }> = [{ id: 'all', label: 'All' }];
  if (services.movies) categories.push({ id: 'movies', label: 'Movies' });
  categories.push({ id: 'live', label: 'Live' });
  if (services.videos) categories.push({ id: 'videos', label: 'Videos' });
  if (services.verticals) categories.push({ id: 'series', label: 'Series' });
  categories.push({ id: 'trending', label: 'Trending' });
  return categories;
}

type Props = {
  active: HomeCategory;
  onChange: (c: HomeCategory) => void;
  categories?: Array<{ id: HomeCategory; label: string }>;
};

export function CategoryTabs({ active, onChange, categories = CATEGORIES }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((c) => (
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
