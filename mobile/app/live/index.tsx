import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { LiveStreamCard } from '@/components/feed/LiveStreamCard';
import { mockLiveStreams } from '@/mocks';
import { colors } from '@/theme/tokens';

export default function LiveBrowseScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader showBack title="Live now" showSearch={false} showNotifications={false} />
      </View>
      <FlatList
        data={mockLiveStreams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/live/${item.id}`)} style={styles.card}>
            <LiveStreamCard stream={item} />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No live streams right now</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { marginBottom: 12 },
  empty: { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 40 },
});
