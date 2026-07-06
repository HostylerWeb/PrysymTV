import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/theme/tokens';

const STATS = [
  { label: 'Views (24h)', value: '12.4K' },
  { label: 'Views (7d)', value: '48.2K' },
  { label: 'Earnings (30d)', value: '$186.40' },
  { label: 'Coins received (30d)', value: '🪙 4,200' },
];

const TOP_VIDEOS = [
  { title: 'Behind the scenes: studio tour', views: '8.2K' },
  { title: 'Community highlights', views: '5.1K' },
  { title: 'Live Q&A recap', views: '3.8K' },
];

export default function CreatorDashboardScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Creator dashboard" showSearch={false} showNotifications={false} />
        <Text style={styles.sub}>Mock metrics from GET /analytics/creators/me/dashboard</Text>
        <View style={styles.grid}>
          {STATS.map((s) => (
            <Card key={s.label} style={styles.stat}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
            </Card>
          ))}
        </View>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Views trend (7d)</Text>
          <View style={styles.chart}>
            {[40, 65, 50, 80, 72, 90, 85].map((h, i) => (
              <View key={i} style={[styles.bar, { height: h }]} />
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Top content</Text>
          {TOP_VIDEOS.map((v) => (
            <View key={v.title} style={styles.videoRow}>
              <Text style={styles.videoTitle}>{v.title}</Text>
              <Text style={styles.videoViews}>{v.views}</Text>
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Payouts</Text>
          <Text style={styles.cardSub}>Available: $142.00 · Min withdrawal $50</Text>
          <Button label="Request payout" variant="secondary" style={{ marginTop: 12 }} />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Payout profile</Text>
          <Text style={styles.cardSub}>Bank / PayPal setup - mock creator-payout-setup</Text>
          <Button label="Update payout method" variant="outline" style={{ marginTop: 12 }} />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.cardTitle}>Channel memberships</Text>
          <Text style={styles.cardSub}>3 active subscribers · $14.97/mo recurring</Text>
          <Button label="Manage tiers" variant="outline" style={{ marginTop: 12 }} />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%' },
  statLabel: { color: colors.mutedForeground, fontSize: 11 },
  statValue: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 6 },
  cardTitle: { ...typography.h3, color: colors.foreground },
  cardSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100, marginTop: 12 },
  bar: { flex: 1, backgroundColor: colors.primary + '66', borderRadius: 4 },
  videoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  videoTitle: { color: colors.foreground, flex: 1, fontSize: 14 },
  videoViews: { color: colors.mutedForeground, fontSize: 12 },
});
