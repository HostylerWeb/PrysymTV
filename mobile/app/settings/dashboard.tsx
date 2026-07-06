import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/theme/tokens';

const METRICS = [
  { label: 'Views (7d)', value: '48.2K' },
  { label: 'Watch time (7d)', value: '312h' },
  { label: 'Revenue (30d)', value: '$186.40' },
  { label: 'Subscribers gained', value: '+124' },
];

export default function SettingsDashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Performance & Revenue" showSearch={false} showNotifications={false} />
        <Text style={styles.sub}>Creator analytics - mock GET /analytics/creators/me/dashboard</Text>
        <View style={styles.grid}>
          {METRICS.map((m) => (
            <Card key={m.label} style={styles.stat}>
              <Text style={styles.statLabel}>{m.label}</Text>
              <Text style={styles.statValue}>{m.value}</Text>
            </Card>
          ))}
        </View>
        <Card style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Payouts</Text>
          <Text style={styles.cardSub}>Available balance: $142.00 · Minimum $50</Text>
          <Button label="Request payout" variant="secondary" style={{ marginTop: 12 }} />
        </Card>
        <Button label="Open full creator dashboard" variant="outline" onPress={() => router.push('/creator-dashboard')} style={{ marginTop: 16 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%' },
  statLabel: { color: colors.mutedForeground, fontSize: 11 },
  statValue: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 6 },
  cardTitle: { ...typography.h3, color: colors.foreground },
  cardSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
});
