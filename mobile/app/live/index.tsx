import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { LiveStreamCard } from '@/components/feed/LiveStreamCard';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useLiveStreams } from '@/hooks/api/useLiveStreams';
import { colors } from '@/theme/tokens';

export default function LiveBrowseScreen() {
  const router = useRouter();
  const liveQuery = useLiveStreams();
  const streams = liveQuery.data ?? [];
  const isLoading = liveQuery.isLoading && !liveQuery.data;

  return (
    <View style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader showBack title="Live now" showSearch={false} showNotifications={false} />
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
      ) : liveQuery.isError ? (
        <FeedQueryState isError error={liveQuery.error} onRetry={() => void liveQuery.refetch()} />
      ) : (
        <FlatList
          data={streams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={liveQuery.isFetching}
          onRefresh={() => void liveQuery.refetch()}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/live/${item.id}`)} style={styles.card}>
              <LiveStreamCard stream={item} />
            </Pressable>
          )}
          ListEmptyComponent={
            <FeedQueryState
              isEmpty
              emptyTitle="No live streams"
              emptyMessage="Nobody is live right now. Check back later."
              onRetry={() => void liveQuery.refetch()}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { marginBottom: 12 },
});
