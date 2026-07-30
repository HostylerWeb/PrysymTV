import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ContentCard } from '@/components/tv/ContentCard';
import { useVerticalsList } from '@/hooks/api/useVerticalsList';
import { colors, spacing, typography } from '@/theme/tokens';

export default function VerticalsScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useVerticalsList();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Vertical series</Text>
      <Text style={styles.sub}>Micro-drama — pick a series, then an episode</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>Could not load verticals.</Text>
      ) : (
        <View style={styles.grid}>
          {(data ?? []).map((series, index) => (
            <ContentCard
              key={series.slug}
              title={series.title}
              thumbnailUrl={series.posterUrl}
              subtitle={`${series.episodeCount} episodes`}
              aspectRatio={9 / 16}
              hasTVPreferredFocus={index === 0}
              onPress={() =>
                router.push({
                  pathname: '/(main)/verticals/[slug]',
                  params: { slug: series.slug },
                })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.xl, paddingRight: spacing.lg },
  heading: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  sub: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  error: { color: '#ff6b6b', fontSize: typography.body, paddingHorizontal: spacing.lg },
});
