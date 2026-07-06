import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors } from '@/theme/tokens';

const PREFS = [
  { key: 'likes', label: 'Likes on your content' },
  { key: 'comments', label: 'Comments & replies' },
  { key: 'follows', label: 'New followers' },
  { key: 'follow', label: 'Creators you follow go live' },
  { key: 'live', label: 'Live stream alerts' },
  { key: 'uploads', label: 'Upload processing' },
  { key: 'system', label: 'System & account' },
] as const;

export default function NotificationSettingsScreen() {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.pad}>
        <AppHeader showBack title="Notifications" showSearch={false} showNotifications={false} />
        <Text style={styles.sub}>Matches web notification preferences - mock toggles</Text>
        {PREFS.map((p) => (
          <View key={p.key} style={styles.row}>
            <Text style={styles.label}>{p.label}</Text>
            <Switch value trackColor={{ true: colors.primary }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { color: colors.foreground, fontSize: 15, flex: 1, paddingRight: 12 },
});
