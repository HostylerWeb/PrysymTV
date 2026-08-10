import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { ContentGrid } from '@/components/tv/ContentGrid';
import { useVideosFeed } from '@/hooks/api/useVideosFeed';
import { useOpenWatch } from '@/hooks/useOpenWatch';
import { colors, spacing, typography } from '@/theme/tokens';
import { withContentServiceGate } from '@/components/tv/ContentServiceGate';

function VideosScreen() {
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
        <ContentGrid
          items={data?.items ?? []}
          onItemPress={openWatch}
          preferInitialFocus
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

export default withContentServiceGate('videos', VideosScreen);
