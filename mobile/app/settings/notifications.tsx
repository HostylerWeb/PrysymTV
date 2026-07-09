import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { PushNotificationToggle } from '@/components/settings/PushNotificationToggle';
import {
  fetchNotificationPreferences,
  updateNotificationPreference,
} from '@/lib/api/notifications';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';

const PREFS = [
  { key: 'follow', label: 'New followers', description: 'When someone follows you' },
  { key: 'like', label: 'Likes', description: 'When someone likes your videos or comments' },
  { key: 'comment', label: 'Comments & replies', description: 'When someone comments or replies' },
  { key: 'live', label: 'Live alerts', description: 'When creators you follow go live' },
  { key: 'upload', label: 'New uploads', description: 'When subscribed creators post' },
  { key: 'gift', label: 'Gifts received', description: 'When you receive a gift on stream' },
  { key: 'system', label: 'System updates', description: 'Platform news and milestones' },
] as const;

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map((p) => [p.key, true])),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const apiPrefs = await fetchNotificationPreferences();
        if (cancelled) return;
        const next = Object.fromEntries(PREFS.map((p) => [p.key, true]));
        for (const pref of apiPrefs) {
          next[pref.type] = pref.enabled;
        }
        setPrefs(next);
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePref = (key: string, enabled: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: enabled }));
    void updateNotificationPreference(key, enabled).catch(() => {
      setPrefs((prev) => ({ ...prev, [key]: !enabled }));
    });
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader showBack title="Notifications" showSearch={false} showNotifications={false} />
        <Text style={styles.sub}>Choose what you want to be notified about.</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : null}

        <PushNotificationToggle featured />

        <Text style={styles.sectionLabel}>Notification types</Text>
        {PREFS.map((p) => (
          <View key={p.key} style={styles.row}>
            <View style={styles.rowCopy}>
              <Text style={styles.label}>{p.label}</Text>
              <Text style={styles.rowDesc}>{p.description}</Text>
            </View>
            <Switch
              value={prefs[p.key] ?? true}
              onValueChange={(v) => togglePref(p.key, v)}
              trackColor={{ true: colors.primary }}
              disabled={loading}
            />
          </View>
        ))}
        <Text style={styles.hint}>Changes save automatically.</Text>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    pad: { paddingHorizontal: 16, paddingBottom: 32 },
    sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12, lineHeight: 19 },
    sectionLabel: {
      color: colors.mutedForeground,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 8,
      marginTop: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowCopy: { flex: 1 },
    label: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
    rowDesc: { color: colors.mutedForeground, fontSize: 12, marginTop: 3, lineHeight: 17 },
    hint: { color: colors.mutedForeground, fontSize: 12, marginTop: 16, lineHeight: 18 },
  });
}
