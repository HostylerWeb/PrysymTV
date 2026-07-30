import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ContentRow } from '@/components/tv/ContentRow';
import { useMoviesFeed } from '@/hooks/api/useMoviesFeed';
import { colors, spacing, typography } from '@/theme/tokens';
import type { VideoCard } from '@/types/api';

export default function MoviesScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useMoviesFeed();

  const openWatch = (item: VideoCard) => {
    router.push({
      pathname: '/watch/[id]',
      params: { id: item.id, title: item.title, playbackUrl: item.playbackUrl ?? '' },
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Movies</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>Could not load movies.</Text>
      ) : (
        <ContentRow
          title="Featured"
          items={data?.items ?? []}
          onItemPress={openWatch}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.xl },
  heading: {
    color: colors.foreground,
    fontSize: typography.title,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  error: {
    color: '#ff6b6b',
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
});
