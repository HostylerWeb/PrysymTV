import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationsSheet } from '@/components/modals/NotificationsSheet';
import { useMockAuth } from '@/context/MockAuthContext';
import { useUnreadNotificationCount } from '@/hooks/api/useNotifications';
import { resolveAvatarUrl } from '@/lib/media-url';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing, withAlpha } from '@/theme/tokens';
import { commonStyles } from '@/theme/styles';

import type { SearchScope } from '@/lib/search-scope';

type Props = {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  searchScope?: SearchScope;
  showNotifications?: boolean;
  showCreate?: boolean;
  showCast?: boolean;
  sticky?: boolean;
  edgeToEdge?: boolean;
  onCreatePress?: () => void;
};

export function AppHeader({
  title,
  showBack = false,
  showSearch = true,
  searchScope,
  showNotifications = true,
  showCreate = false,
  showCast = false,
  sticky = false,
  edgeToEdge = false,
  onCreatePress,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useMockAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { unread } = useUnreadNotificationCount(isAuthenticated);
  const topPad = edgeToEdge ? 0 : insets.top + spacing.sm;

  const avatarUri =
    isAuthenticated && user
      ? resolveAvatarUrl(user.avatarUrl, user.username ?? user.displayName ?? 'user')
      : null;

  return (
    <>
      <View
        style={[
          styles.wrap,
          { backgroundColor: colors.background },
          sticky && [
            styles.sticky,
            {
              backgroundColor: withAlpha(colors.background, 0.95),
              borderBottomColor: colors.border,
            },
          ],
          { paddingTop: topPad },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.left}>
            {showBack ? (
              <Pressable onPress={() => router.back()} style={commonStyles.iconButton} hitSlop={8}>
                <Ionicons name="chevron-back" size={24} color={colors.foreground} />
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push('/(tabs)/home')} style={styles.logoBtn}>
                <Image source={require('../../../assets/logo.webp')} style={styles.logoImage} contentFit="contain" />
              </Pressable>
            )}
            {title ? (
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            {showCreate && onCreatePress && (
              <Pressable onPress={onCreatePress} style={[styles.createBtn, { backgroundColor: colors.secondary }]}>
                <Ionicons name="add" size={22} color={colors.foreground} />
              </Pressable>
            )}
            {showCast && (
              <Pressable
                style={commonStyles.iconButton}
                onPress={() => Alert.alert('Cast', 'Casting to TV is coming soon on mobile.')}
              >
                <Ionicons name="tv-outline" size={20} color={colors.foreground} />
              </Pressable>
            )}
            {showSearch && (
              <Pressable
                onPress={() => router.push(searchScope ? `/search?scope=${searchScope}` : '/search')}
                style={commonStyles.iconButton}
              >
                <Ionicons name="search" size={22} color={colors.foreground} />
              </Pressable>
            )}
            {showNotifications && (
              <Pressable
                onPress={() => {
                  if (isAuthenticated) setNotificationsOpen(true);
                  else router.push('/(auth)/login');
                }}
                style={commonStyles.iconButton}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
                {isAuthenticated && unread > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/profile')}
              style={styles.avatarBtn}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.avatarImage,
                    {
                      borderColor: withAlpha(colors.border, 0.6),
                      backgroundColor: colors.secondary,
                    },
                  ]}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person-circle-outline" size={28} color={colors.foreground} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
      <NotificationsSheet visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  sticky: {
    marginBottom: 0,
    marginHorizontal: -spacing.page,
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  logoBtn: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 120, height: 32 },
  title: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatarBtn: {
    padding: 4,
    marginLeft: 2,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 2,
  },
});
