import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useMockAuth } from '@/context/MockAuthContext';
import {
  useNotificationActions,
  useNotifications,
} from '@/hooks/api/useNotifications';
import type { NotificationListItem } from '@/lib/map-notifications';
import { colors, radius } from '@/theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useMockAuth();
  const notificationsQuery = useNotifications(isAuthenticated);
  const actions = useNotificationActions();

  const openItem = async (item: NotificationListItem) => {
    if (!item.isRead) await actions.markRead(item.id);
    if (!item.navTarget) return;
    if (typeof item.navTarget === 'string') router.push(item.navTarget as never);
    else router.push(item.navTarget as never);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader showBack title="Notifications" showSearch={false} showNotifications={false} />
        {isAuthenticated && (notificationsQuery.data?.length ?? 0) > 0 ? (
          <View style={styles.actions}>
            <Button label="Mark all read" variant="outline" onPress={() => void actions.markAllRead()} />
            <Button
              label="Clear all"
              variant="ghost"
              onPress={() =>
                Alert.alert('Clear notifications', 'Remove all notifications?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => void actions.clearAll() },
                ])
              }
            />
          </View>
        ) : null}
      </View>

      {!isAuthenticated ? (
        <View style={styles.center}>
          <Text style={styles.guestMsg}>Sign in to see notifications.</Text>
          <Button label="Sign in" onPress={() => router.push('/(auth)/login')} />
        </View>
      ) : notificationsQuery.isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.center} />
      ) : notificationsQuery.isError ? (
        <FeedQueryState
          isError
          error={notificationsQuery.error}
          onRetry={() => void notificationsQuery.refetch()}
        />
      ) : (
        <FlatList
          data={notificationsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.isRead && styles.unread]}
              onPress={() => void openItem(item)}
            >
              <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
              <View style={styles.copy}>
                <Text style={styles.msg}>
                  <Text style={styles.user}>{item.user} </Text>
                  {item.message}
                </Text>
                <Text style={styles.type}>{item.time} · {item.type}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  center: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  guestMsg: { color: colors.mutedForeground, marginBottom: 12 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { color: colors.mutedForeground, textAlign: 'center', padding: 32 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unread: { borderColor: colors.primary + '55' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.muted },
  copy: { flex: 1 },
  user: { fontWeight: '700', color: colors.foreground },
  msg: { color: colors.foreground, fontSize: 14, lineHeight: 20 },
  type: { color: colors.mutedForeground, fontSize: 11, marginTop: 6, textTransform: 'uppercase' },
});
