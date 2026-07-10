import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MeResponse } from '@/types/api';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography, withAlpha } from '@/theme/tokens';

type Props = {
  visible: boolean;
  user: MeResponse;
  initialScreen?: string;
  onClose: () => void;
  onCoins: () => void;
  onStreamerApply: () => void;
  onUnlockFeatures?: () => void;
  onLogout: () => void;
};

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route?: string;
  action?: () => void;
  toggle?: boolean;
  danger?: boolean;
  accent?: 'premium' | 'live';
};

export function ProfileSettingsSheet({
  visible,
  user,
  initialScreen,
  onClose,
  onCoins,
  onStreamerApply,
  onUnlockFeatures,
  onLogout,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, setDarkMode } = useTheme();
  const isStreamer = user.streamerStatus === 'approved';
  const showDashboard = user.role === 'creator' || (user.videosCount ?? 0) > 0;
  const premiumActive =
    !!user.premiumTier &&
    user.premiumTier !== 'none' &&
    (!user.premiumExpiresAt || new Date(user.premiumExpiresAt).getTime() > Date.now());
  useEffect(() => {
    if (!visible) return;
    if (initialScreen) {
      const routes: Record<string, string> = {
        notifications: '/settings/notifications',
        shipping: '/settings/shipping',
        playlists: '/settings/playlists',
        social: '/settings/social',
        dashboard: '/settings/dashboard',
        memberships: '/premium',
      };
      const route = routes[initialScreen];
      if (route) {
        onClose();
        router.push(`${route}?returnToSettings=1` as never);
      }
    }
  }, [visible, initialScreen, onClose, router]);

  if (!visible) return null;

  const navigate = (route: string) => {
    onClose();
    const sep = route.includes('?') ? '&' : '?';
    router.push(`${route}${sep}returnToSettings=1` as never);
  };

  const items: MenuItem[] = [
    {
      icon: 'diamond-outline',
      label: premiumActive ? 'Premium Member' : 'Upgrade to Premium',
      description: premiumActive
        ? 'Ad-free viewing and exclusive perks active'
        : 'Ad-free viewing & exclusive perks',
      route: '/premium',
      accent: 'premium',
    },
    {
      icon: 'sparkles-outline',
      label: 'Platform Insider',
      description: 'Roadmaps, town halls & platform voice',
      route: '/insider',
      accent: 'premium',
    },
    { icon: 'ribbon-outline', label: 'Channel memberships', description: 'Creators you support monthly', route: '/premium' },
    isStreamer
      ? {
          icon: 'radio-outline',
          label: 'Go Live',
          description: 'Live Studio - camera or OBS',
          route: '/go-live',
          accent: 'live',
        }
      : {
          icon: 'radio-outline',
          label: 'Become a Streamer',
          description:
            user.streamerStatus === 'pending' ? 'Application pending...' : 'Apply to start streaming',
          action: () => {
            onClose();
            onStreamerApply();
          },
          accent: 'live',
        },
    user.verticalCreatorStatus === 'approved'
      ? {
          icon: 'grid-outline',
          label: 'Micro-dramas',
          description: 'Manage vertical series & episodes',
          route: '/settings/verticals',
        }
      : {
          icon: 'grid-outline',
          label: 'Micro-dramas',
          description:
            user.verticalCreatorStatus === 'pending'
              ? 'Application pending...'
              : 'Apply to publish vertical series',
          action: () => {
            onClose();
            onUnlockFeatures?.();
          },
        },
    { icon: 'cube-outline', label: 'Shipping & checkout', description: 'Address for store purchases', route: '/settings/shipping' },
    { icon: 'list-outline', label: 'Playlists', description: 'Create and manage playlists', route: '/settings/playlists' },
    { icon: 'link-outline', label: 'Social Links', description: 'Links on your creator profile', route: '/settings/social' },
    ...(showDashboard
      ? [{
          icon: 'bar-chart-outline' as const,
          label: 'Performance & Revenue',
          description: 'Views, ads on your videos, earnings, impact',
          route: '/settings/dashboard' as const,
        }]
      : []),
    { icon: 'notifications-outline', label: 'Notifications', description: 'Email & push preferences', route: '/settings/notifications' },
    {
      icon: 'moon-outline',
      label: 'Dark Mode',
      description: isDark ? 'Currently enabled' : 'Currently disabled',
      toggle: true,
      action: () => setDarkMode(!isDark),
    },
    { icon: 'help-circle-outline', label: 'Help & Support', description: 'FAQs and contact', route: '/help' },
    {
      icon: 'log-out-outline',
      label: 'Sign Out',
      description: 'Log out of your account',
      action: () => {
        onClose();
        onLogout();
      },
      danger: true,
    },
  ];

  const title = 'Settings';

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: '88%', backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={22} color={colors.foreground} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <Pressable style={[styles.coinsCard, { backgroundColor: withAlpha(colors.yellow, 0.1), borderColor: withAlpha(colors.yellow, 0.25) }]} onPress={() => { onClose(); onCoins(); }}>
            <View style={styles.coinsIcon}>
              <Text style={styles.coinsEmoji}>🪙</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.coinsTitle, { color: colors.foreground }]}>Your Coins</Text>
              <Text style={[styles.coinsSub, { color: colors.mutedForeground }]}>
                {user.coinsBalance.toLocaleString()} available
              </Text>
            </View>
            <Text style={[styles.coinsCta, { color: colors.primary }]}>Top Up</Text>
          </Pressable>

          {items.map((item) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                item.accent === 'premium' && { backgroundColor: withAlpha(colors.primary, 0.06) },
              ]}
              onPress={() => {
                if (item.toggle && item.action) item.action();
                else if (item.action) item.action();
                else if (item.route) navigate(item.route);
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }, item.danger && { backgroundColor: withAlpha(colors.destructive, 0.1) }]}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? colors.destructive : colors.foreground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: item.danger ? colors.destructive : colors.foreground }]}>{item.label}</Text>
                {!item.toggle && item.description ? (
                  <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                ) : null}
              </View>
              {item.toggle ? (
                <Switch value={isDark} onValueChange={setDarkMode} trackColor={{ true: colors.primary }} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

function Field({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.field, { borderBottomColor: colors.border }]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function StatCard({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ButtonRow({ label, onPress, colors }: { label: string; onPress: () => void; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <Pressable style={styles.linkBtn} onPress={onPress}>
      <Text style={[styles.linkBtnText, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  headerIcon: { width: 40, alignItems: 'center' },
  headerTitle: { ...typography.h2, flex: 1, textAlign: 'center' },
  body: { padding: spacing.page },
  coinsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  coinsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsEmoji: { fontSize: 22 },
  coinsTitle: { fontWeight: '700', fontSize: 15 },
  coinsSub: { fontSize: 12, marginTop: 2 },
  coinsCta: { fontWeight: '700', fontSize: 14 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontWeight: '600', fontSize: 15 },
  menuDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    marginTop: 4,
  },
  field: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  fieldValue: { fontSize: 15 },
  statCard: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  hint: { fontSize: 12, marginTop: 16, lineHeight: 18 },
  linkBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  linkBtnText: { fontWeight: '700' },
});
