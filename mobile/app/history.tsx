import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { ContinueWatchingRow } from '@/components/feed/ContinueWatchingRow';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useHistoryScreen } from '@/hooks/api/useHistory';
import { clearHistory, deleteHistoryItem } from '@/lib/api/history';
import { colors, radius } from '@/theme/tokens';

export default function HistoryScreen() {
  const router = useRouter();
  const historyQuery = useHistoryScreen(1, 24);
  const [busy, setBusy] = useState(false);

  const removeItem = (contentType: 'video' | 'podcast_episode' | 'vertical_episode', contentId: string) => {
    void (async () => {
      try {
        await deleteHistoryItem(contentType, contentId);
        void historyQuery.refetch();
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not remove item');
      }
    })();
  };

  const clearAll = () => {
    Alert.alert('Clear history', 'Remove all watch history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await clearHistory();
              void historyQuery.refetch();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not clear history');
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const openRoute = (route: string | { pathname: string; params?: Record<string, string> }) => {
    if (typeof route === 'string') router.push(route as never);
    else router.push(route as never);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="History" showSearch={false} showNotifications={false} />
        <Button
          label={busy ? 'Clearing…' : 'Clear all history'}
          variant="outline"
          onPress={clearAll}
          disabled={busy}
          style={{ marginBottom: 16 }}
        />
      </View>

      {historyQuery.isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : historyQuery.isError ? (
        <FeedQueryState isError error={historyQuery.error} onRetry={() => void historyQuery.refetch()} />
      ) : (
        <>
          <ContinueWatchingRow items={historyQuery.data?.continueWatching ?? []} />
          <Text style={styles.section}>Recently watched</Text>
          {(historyQuery.data?.items.length ?? 0) === 0 ? (
            <Text style={styles.empty}>No watch history</Text>
          ) : (
            historyQuery.data!.items.map((item) => (
              <Pressable key={item.key} style={styles.row} onPress={() => openRoute(item.route)}>
                <View style={styles.meta}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.sub}>{item.subtitle}</Text>
                </View>
                <Pressable onPress={() => removeItem(item.contentType, item.contentId)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </Pressable>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  section: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
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
