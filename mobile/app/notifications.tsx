import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { mockNotifications } from '@/mocks';
import { colors, radius } from '@/theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader showBack title="Notifications" showSearch={false} showNotifications={false} />
      </View>
      <FlatList
        data={mockNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, !item.isRead && styles.unread]}
            onPress={() => {
              if (item.actorUsername) router.push(`/creator/${item.actorUsername}`);
            }}
          >
            <Text style={styles.msg}>
              {item.actorUsername ? `@${item.actorUsername} ` : ''}{item.message}
            </Text>
            <Text style={styles.type}>{item.type}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  list: { padding: 16, paddingBottom: 40 },
  row: { padding: 14, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  unread: { borderColor: colors.primary + '55' },
  msg: { color: colors.foreground, fontSize: 14 },
  type: { color: colors.mutedForeground, fontSize: 11, marginTop: 6, textTransform: 'uppercase' },
});
