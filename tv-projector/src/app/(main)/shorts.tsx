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
import { flattenShortsPages, useShortsFeed } from '@/hooks/api/useShortsFeed';
import { useOpenShort } from '@/hooks/useOpenWatch';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ShortsScreen() {
  const openShort = useOpenShort();
  const shortsQuery = useShortsFeed(32);
  const shorts = flattenShortsPages(shortsQuery.data?.pages);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Shorts</Text>
      <Text style={styles.sub}>Quick vertical videos</Text>
      {shortsQuery.isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : shorts.length ? (
        <View style={styles.grid}>
          {shorts.map((item, index) => (
            <ContentCard
              key={item.id}
              title={item.title}
              thumbnailUrl={item.thumbnailUrl}
              subtitle={item.channel}
              aspectRatio={9 / 16}
              hasTVPreferredFocus={index === 0}
              onPress={() => openShort(item)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No shorts yet.</Text>
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
  empty: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    paddingHorizontal: spacing.lg,
  },
});
