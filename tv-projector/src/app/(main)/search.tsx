import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ContentCard } from '@/components/tv/ContentCard';
import { useSearch } from '@/hooks/api/useSearch';
import { colors, spacing, typography } from '@/theme/tokens';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isFetching } = useSearch(query);

  const hasQuery = query.trim().length >= 2;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Search</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search videos, movies, podcasts..."
        placeholderTextColor={colors.mutedForeground}
        style={styles.input}
        autoCapitalize="none"
      />

      {isFetching ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : null}

      {hasQuery && data?.movies?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movies</Text>
          <View style={styles.results}>
            {data.movies.map((item, index) => (
              <ContentCard
                key={item.id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                subtitle="Movie"
                hasTVPreferredFocus={index === 0 && !data?.videos.length}
                onPress={() =>
                  router.push({
                    pathname: '/watch/[id]',
                    params: { id: item.id, title: item.title },
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {hasQuery && data?.shorts?.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shorts</Text>
          <View style={styles.results}>
            {data.shorts.map((item) => (
              <ContentCard
                key={item.id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                aspectRatio={9 / 16}
                onPress={() =>
                  router.push({
                    pathname: '/shorts/[id]',
                    params: { id: item.id, title: item.title },
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {hasQuery && data?.videos.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Videos</Text>
          <View style={styles.results}>
            {data.videos.map((item, index) => (
              <ContentCard
                key={item.id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                subtitle={item.type}
                hasTVPreferredFocus={index === 0}
                onPress={() =>
                  router.push({
                    pathname: '/watch/[id]',
                    params: { id: item.id, title: item.title },
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {hasQuery && data?.verticals.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verticals</Text>
          <View style={styles.results}>
            {data.verticals.map((item) => (
              <ContentCard
                key={item.slug}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                subtitle={`${item.episodes} episodes`}
                aspectRatio={9 / 16}
                onPress={() =>
                  router.push({
                    pathname: '/(main)/verticals/[slug]',
                    params: { slug: item.slug },
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {hasQuery && data?.podcasts.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podcasts</Text>
          <View style={styles.results}>
            {data.podcasts.map((item) => (
              <ContentCard
                key={item.id}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                onPress={() =>
                  router.push({ pathname: '/podcast/[id]', params: { id: item.id } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {hasQuery && data?.streams.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live</Text>
          <View style={styles.results}>
            {data.streams.map((item) => (
              <ContentCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                onPress={() =>
                  router.push({ pathname: '/live/[id]', params: { id: item.id } })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      {hasQuery && !isFetching && !data?.videos.length && !data?.movies?.length && !data?.shorts?.length && !data?.verticals.length && !data?.podcasts.length && !data?.streams.length ? (
        <Text style={styles.empty}>No results for "{query}"</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  heading: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.secondary,
    color: colors.foreground,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  loader: { marginVertical: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  results: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    marginTop: spacing.lg,
  },
});
