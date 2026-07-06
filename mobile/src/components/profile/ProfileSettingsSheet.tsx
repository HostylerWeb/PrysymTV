import React, { useEffect, useState } from 'react';
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
import { colors, radius, spacing, typography, withAlpha } from '@/theme/tokens';

type SettingsScreen = 'main' | 'notifications' | 'shipping' | 'playlists' | 'social' | 'dashboard';

type Props = {
  visible: boolean;
  user: MeResponse;
  darkMode: boolean;
  initialScreen?: string;
  onClose: () => void;
  onDarkMode: (v: boolean) => void;
  onCoins: () => void;
  onStreamerApply: () => void;
  onLogout: () => void;
};

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route?: string;
  screen?: SettingsScreen;
  action?: () => void;
  toggle?: boolean;
  danger?: boolean;
  accent?: 'premium' | 'live';
};

const SCREEN_TITLES: Record<Exclude<SettingsScreen, 'main'>, string> = {
  notifications: 'Notifications',
  shipping: 'Shipping & checkout',
  playlists: 'Playlists',
  social: 'Social links',
  dashboard: 'Performance & revenue',
};

export function ProfileSettingsSheet({
  visible,
  user,
  darkMode,
  initialScreen,
  onClose,
  onDarkMode,
  onCoins,
  onStreamerApply,
  onLogout,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isStreamer = user.streamerStatus === 'approved';
  const showDashboard = user.role === 'creator' || (user.videosCount ?? 0) > 0;
  const premiumActive =
    !!user.premiumTier &&
    user.premiumTier !== 'none' &&
    (!user.premiumExpiresAt || new Date(user.premiumExpiresAt).getTime() > Date.now());
  const [screen, setScreen] = useState<SettingsScreen>('main');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [liveAlerts, setLiveAlerts] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const valid = ['notifications', 'shipping', 'playlists', 'social', 'dashboard'] as const;
    if (initialScreen && valid.includes(initialScreen as typeof valid[number])) {
      setScreen(initialScreen as SettingsScreen);
    } else {
      setScreen('main');
    }
  }, [visible, initialScreen]);

  if (!visible) return null;

  const navigate = (route: string) => {
    onClose();
    router.push(route as never);
  };

  const items: MenuItem[] = [
    ...(!premiumActive
      ? [
          {
            icon: 'diamond-outline' as const,
            label: 'Upgrade to Premium',
            description: 'Ad-free viewing & exclusive perks',
            route: '/premium',
            accent: 'premium' as const,
          },
        ]
      : []),
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
    { icon: 'time-outline', label: 'Watch History', description: 'Recently watched content', route: '/history' },
    { icon: 'cube-outline', label: 'Shipping & checkout', description: 'Address for store purchases', screen: 'shipping' },
    { icon: 'list-outline', label: 'Playlists', description: 'Create and manage playlists', screen: 'playlists' },
    { icon: 'link-outline', label: 'Social Links', description: 'Links on your creator profile', screen: 'social' },
    ...(showDashboard
      ? [{
          icon: 'bar-chart-outline' as const,
          label: 'Performance & Revenue',
          description: 'Views, ads on your videos, earnings, impact',
          screen: 'dashboard' as const,
        }]
      : []),
    { icon: 'notifications-outline', label: 'Notifications', description: 'Email & push preferences', screen: 'notifications' },
    {
      icon: 'moon-outline',
      label: 'Dark Mode',
      description: darkMode ? 'Currently enabled' : 'Currently disabled',
      toggle: true,
      action: () => onDarkMode(!darkMode),
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

  const renderSubScreen = () => {
    switch (screen) {
      case 'notifications':
        return (
          <>
            <ToggleRow label="Email notifications" value={emailNotifs} onChange={setEmailNotifs} />
            <ToggleRow label="Push notifications" value={pushNotifs} onChange={setPushNotifs} />
            <ToggleRow label="Live stream alerts" value={liveAlerts} onChange={setLiveAlerts} />
            <Text style={styles.hint}>Preferences are saved locally for this mock build.</Text>
          </>
        );
      case 'shipping':
        return (
          <>
            <Field label="Full name" value={user.displayName ?? ''} />
            <Field label="Address" value="123 Creator Lane" />
            <Field label="City" value="Los Angeles, CA 90001" />
            <Text style={styles.hint}>Manage full shipping details from the creator store checkout flow.</Text>
          </>
        );
      case 'playlists':
        return (
          <>
            <Field label="Favorites" value="12 items" />
            <Field label="Watch later" value="5 items" />
            <Pressable style={styles.linkBtn} onPress={() => navigate('/settings/playlists')}>
              <Text style={styles.linkBtnText}>Open playlist manager</Text>
            </Pressable>
          </>
        );
      case 'social':
        return (
          <>
            <Field label="Website" value="https://prysym.tv" />
            <Field label="X / Twitter" value={`@${user.username}`} />
            <Field label="Instagram" value="@prysymtv" />
          </>
        );
      case 'dashboard':
        return (
          <>
            <StatCard label="Views (30d)" value="24.8K" />
            <StatCard label="Ad earnings" value="$128.40" />
            <StatCard label="Gifts received" value="1,420 coins" />
            <Pressable style={styles.linkBtn} onPress={() => navigate('/settings/dashboard')}>
              <Text style={styles.linkBtnText}>Open full dashboard</Text>
            </Pressable>
          </>
        );
      default:
        return null;
    }
  };

  const title = screen === 'main' ? 'Settings' : SCREEN_TITLES[screen];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: '88%' }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          {screen !== 'main' ? (
            <Pressable onPress={() => setScreen('main')} hitSlop={8} style={styles.headerIcon}>
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </Pressable>
          ) : (
            <View style={styles.headerIcon}>
              <Ionicons name="settings-outline" size={22} color={colors.foreground} />
            </View>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {screen === 'main' ? (
            <>
              <Pressable style={styles.coinsCard} onPress={() => { onClose(); onCoins(); }}>
                <View style={styles.coinsIcon}>
                  <Text style={styles.coinsEmoji}>🪙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coinsTitle}>Your Coins</Text>
                  <Text style={styles.coinsSub}>{user.coinsBalance.toLocaleString()} available</Text>
                </View>
                <Text style={styles.coinsCta}>Top Up</Text>
              </Pressable>

              {items.map((item) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.menuItem,
                    item.accent === 'premium' && styles.menuPremium,
                    item.accent === 'live' && styles.menuLive,
                  ]}
                  onPress={() => {
                    if (item.toggle && item.action) item.action();
                    else if (item.action) item.action();
                    else if (item.screen) setScreen(item.screen);
                    else if (item.route) navigate(item.route);
                  }}
                >
                  <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.danger ? colors.destructive : colors.foreground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
                    {!item.toggle && item.description ? (
                      <Text style={styles.menuDesc}>{item.description}</Text>
                    ) : null}
                  </View>
                  {item.toggle ? (
                    <Switch value={darkMode} onValueChange={onDarkMode} trackColor={{ true: colors.primary }} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                  )}
                </Pressable>
              ))}
            </>
          ) : (
            renderSubScreen()
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerIcon: { width: 40, alignItems: 'center' },
  headerTitle: { ...typography.h2, color: colors.foreground, flex: 1, textAlign: 'center' },
  body: { padding: spacing.page },
  coinsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    backgroundColor: withAlpha(colors.yellow, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(colors.yellow, 0.25),
  },
  coinsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: withAlpha(colors.yellow, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsEmoji: { fontSize: 22 },
  coinsTitle: { color: colors.foreground, fontWeight: '700', fontSize: 15 },
  coinsSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  coinsCta: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  menuPremium: { backgroundColor: withAlpha(colors.primary, 0.06), marginBottom: 4 },
  menuLive: { marginBottom: 2 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: withAlpha(colors.destructive, 0.1) },
  menuLabel: { color: colors.foreground, fontWeight: '600', fontSize: 15 },
  menuLabelDanger: { color: colors.destructive },
  menuDesc: { color: colors.mutedForeground, fontSize: 12, marginTop: 2, lineHeight: 16 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
  field: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldLabel: { color: colors.mutedForeground, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  fieldValue: { color: colors.foreground, fontSize: 15 },
  statCard: {
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  statLabel: { color: colors.mutedForeground, fontSize: 12 },
  statValue: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 4 },
  hint: { color: colors.mutedForeground, fontSize: 12, marginTop: 16, lineHeight: 18 },
  linkBtn: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  linkBtnText: { color: colors.primary, fontWeight: '700' },
});
