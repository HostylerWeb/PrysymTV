import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ContentCard } from '@/components/tv/ContentCard';
import { useVerticalSeriesDetail } from '@/hooks/api/useVerticalSeriesDetail';
import { colors, spacing, typography } from '@/theme/tokens';

export default function VerticalSeriesScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useVerticalSeriesDetail(slug);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{data?.title ?? 'Series'}</Text>
      {data?.tagline ? <Text style={styles.sub}>{data.tagline}</Text> : null}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>Could not load series.</Text>
      ) : (
        <View style={styles.grid}>
          {(data?.episodes ?? []).map((ep, index) => (
            <ContentCard
              key={ep.id}
              title={`Ep ${ep.episodeNumber}: ${ep.title}`}
              thumbnailUrl={ep.thumbnailUrl ?? data?.posterUrl}
              subtitle={ep.durationSeconds ? `${Math.round(ep.durationSeconds / 60)} min` : undefined}
              aspectRatio={9 / 16}
              hasTVPreferredFocus={index === 0}
              onPress={() =>
                router.push({
                  pathname: '/verticals/watch/[slug]/[episode]',
                  params: { slug: slug!, episode: String(ep.episodeNumber) },
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
