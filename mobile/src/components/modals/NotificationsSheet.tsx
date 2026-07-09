import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import {
  useNotificationActions,
  useNotifications,
} from '@/hooks/api/useNotifications';
import type { NotificationListItem } from '@/lib/map-notifications';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius, spacing, typography } from '@/theme/tokens';

type Props = { visible: boolean; onClose: () => void };

function iconFor(type: string, colors: ThemeColors): { name: keyof typeof Ionicons.glyphMap; color: string } {
  switch (type) {
    case 'like': return { name: 'heart', color: colors.primary };
    case 'comment': return { name: 'chatbubble', color: '#3b82f6' };
    case 'follow': return { name: 'person-add', color: colors.success };
    case 'live':
    case 'upload': return { name: 'play', color: colors.primary };
    case 'gift': return { name: 'gift', color: colors.warning };
    default: return { name: 'notifications', color: colors.yellow };
  }
}

export function NotificationsSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createNotificationStyles);
  const { isAuthenticated } = useMockAuth();
  const notificationsQuery = useNotifications(visible && isAuthenticated);
  const actions = useNotificationActions();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const slide = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start();
    } else {
      slide.setValue(1);
    }
  }, [visible, slide]);

  const items = notificationsQuery.data ?? [];
  const unreadCount = items.filter((n) => !n.isRead).length;
  const filtered = filter === 'unread' ? items.filter((n) => !n.isRead) : items;

  const openItem = async (item: NotificationListItem) => {
    if (!item.isRead) await actions.markRead(item.id);
    onClose();
    if (!item.navTarget) return;
    if (typeof item.navTarget === 'string') router.push(item.navTarget as never);
    else router.push(item.navTarget as never);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.panel,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) }],
            },
          ]}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={26} color={colors.foreground} />
            </Pressable>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 ? (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadPillText}>{unreadCount}</Text>
                </View>
              ) : null}
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterChip, filter === 'all' && styles.filterChipOn]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextOn]}>All</Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'unread' && styles.filterChipOn]}
              onPress={() => setFilter('unread')}
            >
              <Text style={[styles.filterText, filter === 'unread' && styles.filterTextOn]}>Unread</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            {unreadCount > 0 ? (
              <Pressable onPress={() => void actions.markAllRead()} style={styles.markAll}>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : null}
          </View>

          {!isAuthenticated ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={40} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Sign in to see notifications</Text>
              <Text style={styles.emptySub}>Get alerts when creators you follow go live, like your content, and more.</Text>
              <Button label="Sign in" onPress={() => { onClose(); router.push('/(auth)/login'); }} />
            </View>
          ) : notificationsQuery.isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {filtered.length === 0 ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="notifications-outline" size={36} color={colors.mutedForeground} />
                  </View>
                  <Text style={styles.emptyTitle}>No notifications</Text>
                  <Text style={styles.emptySub}>
                    {filter === 'unread'
                      ? "You're all caught up. No unread notifications."
                      : "When you get notifications, they'll show up here."}
                  </Text>
                </View>
              ) : (
                filtered.map((item) => {
                  const icon = iconFor(item.type, colors);
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.row, !item.isRead && styles.rowUnread]}
                      onPress={() => void openItem(item)}
                    >
                      <View style={styles.avatarWrap}>
                        {item.type === 'system' ? (
                          <View style={styles.systemAvatar}>
                            <Text style={styles.systemLetter}>P</Text>
                          </View>
                        ) : (
                          <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
                        )}
                        <View style={styles.typeBadge}>
                          <Ionicons name={icon.name} size={12} color={icon.color} />
                        </View>
                      </View>
                      <View style={styles.copy}>
                        <Text style={styles.msg}>
                          {item.actorUsername ? (
                            <Text style={styles.user}>@{item.actorUsername} </Text>
                          ) : null}
                          <Text style={styles.msgBody}>{item.message}</Text>
                        </Text>
                        <Text style={styles.time}>{item.time}</Text>
                      </View>
                      {!item.isRead ? <View style={styles.dot} /> : null}
                    </Pressable>
                  );
                })
              )}
              {items.length > 0 ? (
                <Pressable style={styles.clearAll} onPress={() => void actions.clearAll()}>
                  <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
                  <Text style={styles.clearAllText}>Clear all notifications</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createNotificationStyles(colors: ThemeColors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { ...typography.h2, color: colors.foreground, fontWeight: '800' },
  unreadPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  unreadPillText: { color: colors.primaryForeground, fontSize: 11, fontWeight: '800' },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  filterTextOn: { color: colors.primaryForeground },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: spacing.page,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowUnread: { backgroundColor: colors.primary + '08' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary },
  systemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemLetter: { color: colors.primaryForeground, fontWeight: '800', fontSize: 18 },
  typeBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, paddingTop: 2 },
  msg: { fontSize: 14, lineHeight: 20 },
  user: { fontWeight: '700', color: colors.foreground },
  msgBody: { color: colors.foreground + 'CC' },
  time: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: '700' },
  emptySub: { color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  clearAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: spacing.page,
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearAllText: { color: colors.mutedForeground, fontWeight: '600' },
  });
}
