import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { ContinueWatchingRow } from '@/components/feed/ContinueWatchingRow';
import { mockContinueWatching, mockVideos } from '@/mocks';
import { colors, radius } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

const HISTORY = mockVideos.slice(0, 8).map((v, i) => ({
  id: `h-${v.id}`,
  title: v.title,
  watchedAt: `${i + 1}d ago`,
  viewsCount: v.viewsCount ?? 0,
  route: `/watch/${v.id}` as const,
}));

export default function HistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState(HISTORY);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="History" showSearch={false} showNotifications={false} />
        <Button label="Clear all history" variant="outline" onPress={() => setItems([])} style={{ marginBottom: 16 }} />
      </View>
      <ContinueWatchingRow items={mockContinueWatching} />
      <Text style={styles.section}>Recently watched</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No watch history</Text>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} style={styles.row} onPress={() => router.push(item.route)}>
            <View style={styles.meta}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.watchedAt} · {formatViewCount(item.viewsCount)} views</Text>
            </View>
            <Pressable onPress={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  section: { color: colors.foreground, fontWeight: '700', fontSize: 16, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  empty: { color: colors.mutedForeground, textAlign: 'center', padding: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  meta: { flex: 1 },
  title: { color: colors.foreground, fontWeight: '600' },
  sub: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  remove: { color: colors.primary, fontSize: 12, fontWeight: '600' },
});
