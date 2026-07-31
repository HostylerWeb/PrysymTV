import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { ContentRow } from '@/components/tv/ContentRow';
import { useVideosFeed } from '@/hooks/api/useVideosFeed';
import { useOpenWatch } from '@/hooks/useOpenWatch';
import { colors, spacing, typography } from '@/theme/tokens';

export default function VideosScreen() {
  const openWatch = useOpenWatch();
  const { data, isLoading, error } = useVideosFeed();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Videos</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>Could not load videos.</Text>
      ) : (
        <ContentRow
          title="Browse"
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
