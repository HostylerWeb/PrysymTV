import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { LEGAL_LINKS, SETTINGS_MENU } from '@/constants/settings-menu';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, typography } from '@/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useMockAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Settings" showSearch={false} showNotifications={false} />
        <Card>
          <Text style={styles.cardTitle}>{user?.displayName ?? 'Guest'}</Text>
          <Text style={styles.cardSub}>@{user?.username ?? 'sign-in'} · Account & creator tools</Text>
        </Card>

        <Text style={styles.section}>Creator</Text>
        {SETTINGS_MENU.map((item) => (
          <Pressable key={item.route} style={styles.row} onPress={() => router.push(item.route as never)}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.foreground} />
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}

        <Text style={styles.section}>Legal & programs</Text>
        {LEGAL_LINKS.map((l) => (
          <Pressable key={l.route} style={styles.row} onPress={() => router.push(l.route as never)}>
            <Text style={styles.rowLabel}>{l.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  cardTitle: { ...typography.h3, color: colors.foreground },
  cardSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  section: { color: colors.mutedForeground, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { flex: 1, color: colors.foreground, fontSize: 15 },
});
