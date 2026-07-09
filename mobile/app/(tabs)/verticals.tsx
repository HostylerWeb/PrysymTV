import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useMockAuth } from '@/context/MockAuthContext';
import { useCreateFlow } from '@/hooks/useCreateFlow';
import { useVerticalsList } from '@/hooks/api/useVerticalsList';
import { radius, typography } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { useTheme } from '@/theme/ThemeProvider';

export default function VerticalsScreen() {
  const styles = useThemedStyles(createVerticalsStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { requireAuth } = useMockAuth();
  const { trigger, flowHost } = useCreateFlow();
  const [refreshing, setRefreshing] = useState(false);

  const verticalsQuery = useVerticalsList();
  const verticals = verticalsQuery.data ?? [];
  const isLoading = verticalsQuery.isLoading && !verticalsQuery.data;

  const onRefresh = async () => {
    setRefreshing(true);
    await verticalsQuery.refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader
          title="Verticals"
          showCreate
          searchScope="vertical"
          onCreatePress={() => requireAuth(() => trigger('vertical'))}
        />
        <Text style={styles.sub}>Micro-drama series - swipe up episodes</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : verticalsQuery.isError ? (
        <FeedQueryState isError error={verticalsQuery.error} onRetry={() => void verticalsQuery.refetch()} />
      ) : (
        <FlatList
          data={verticals}
          keyExtractor={(item) => item.slug}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }
          ListEmptyComponent={
            <FeedQueryState
              isEmpty
              emptyTitle="No series yet"
              emptyMessage="Vertical micro-dramas will show up here when published."
              onRetry={() => void verticalsQuery.refetch()}
            />
          }
          ListFooterComponent={<PageFooter />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/verticals/${item.slug}`)}>
              <Image source={{ uri: item.posterUrl ?? '' }} style={styles.poster} contentFit="cover" />
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.meta}>{item.episodeCount} episodes · {item.genre}</Text>
            </Pressable>
          )}
        />
      )}
      {flowHost}
    </View>
  );
}

function createVerticalsStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    pad: { paddingHorizontal: 16 },
    sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
    row: { justifyContent: 'space-between', paddingHorizontal: 16 },
    list: { paddingBottom: 0 },
    card: { width: '48%', marginBottom: 20 },
    poster: { width: '100%', aspectRatio: 2 / 3, borderRadius: radius.md, backgroundColor: colors.secondary },
    title: { ...typography.h3, color: colors.foreground, fontSize: 14, marginTop: 8 },
    meta: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
  });
}
