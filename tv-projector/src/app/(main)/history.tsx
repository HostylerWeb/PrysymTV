import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ContentGrid } from '@/components/tv/ContentGrid';
import { useHistoryFeed } from '@/hooks/api/useHistory';
import { prefetchWatchItem } from '@/hooks/useOpenWatch';
import { historyItemPath } from '@/lib/tv-routes';
import { colors, spacing, typography } from '@/theme/tokens';

export default function HistoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useHistoryFeed();

  const items = (data?.items ?? []).map((item) => ({
    id: item.contentId,
    title: item.displayTitle,
    thumbnailUrl: item.thumbnailUrl,
    durationSeconds: 0,
    type: 'video' as const,
    channel: item.completed ? 'Completed' : 'In progress',
    channelSlug: '',
  }));

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Recently watched</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>Could not load history.</Text>
      ) : items.length ? (
        <ContentGrid
          title="Your history"
          items={items}
          preferInitialFocus
          onItemPress={(card) => {
            const item = data?.items.find((h) => h.contentId === card.id);
            if (!item) return;
            if (item.contentType === 'video' && item.video) {
              prefetchWatchItem(queryClient, {
                id: item.video.id,
                thumbnailUrl: item.video.thumbnailUrl,
              });
            }
            const route = historyItemPath(item);
            router.push({
              pathname: route.pathname as never,
              params: route.params as never,
            });
          }}
        />
      ) : (
        <Text style={styles.empty}>No watch history yet.</Text>
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
  error: { color: '#ff6b6b', fontSize: typography.body, paddingHorizontal: spacing.lg },
  empty: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
});
