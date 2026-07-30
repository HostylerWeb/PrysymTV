import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ContentRow } from '@/components/tv/ContentRow';
import { useLiveStreams } from '@/hooks/api/useLiveStreams';
import { colors, spacing, typography } from '@/theme/tokens';

export default function LiveBrowseScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useLiveStreams();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Live now</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>Could not load live streams.</Text>
      ) : data?.length ? (
        <ContentRow
          title="Streaming"
          items={data.map((s) => ({
            id: s.id,
            title: s.title,
            thumbnailUrl: s.thumbnailUrl,
            durationSeconds: 0,
            type: 'video',
            channel: s.streamer,
            channelSlug: s.streamerSlug,
          }))}
          onItemPress={(item) =>
            router.push({ pathname: '/live/[id]', params: { id: item.id } })
          }
        />
      ) : (
        <Text style={styles.empty}>Nobody is live right now. Check back later.</Text>
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
