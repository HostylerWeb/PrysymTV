import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { mockGafTransparency } from '@/mocks/monetization';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

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
  const router = useRouter();
  const { colors } = useTheme();
  const gaf = mockGafTransparency.summary;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Creator dashboard" showSearch={false} showNotifications={false} />
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Performance, earnings, and community impact from your content.
        </Text>
        <View style={styles.grid}>
          {STATS.map((s) => (
            <Card key={s.label} style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            </Card>
          ))}
        </View>

        <Card style={{ marginTop: 16, padding: 16, borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Community impact (GAF)</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground, marginTop: 4 }]}>
            Your content contributed an estimated $12.80 to the Global Advancement Fund this month.
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800', marginTop: 12 }}>
            Platform GAF balance: ${gaf.balanceUsd.toLocaleString()}
          </Text>
          <Button label="View public impact report" variant="outline" style={{ marginTop: 12 }} onPress={() => router.push('/impact')} />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Views trend (7d)</Text>
          <View style={styles.chart}>
            {[40, 65, 50, 80, 72, 90, 85].map((h, i) => (
              <View key={i} style={[styles.bar, { height: h, backgroundColor: colors.primary }]} />
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Top content</Text>
          {TOP_VIDEOS.map((v) => (
            <View key={v.title} style={[styles.videoRow, { borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.foreground, flex: 1 }}>{v.title}</Text>
              <Text style={{ color: colors.mutedForeground }}>{v.views}</Text>
            </View>
          ))}
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Payouts</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Available: $142.00 · Min withdrawal $50</Text>
          <Button label="Request payout" variant="secondary" style={{ marginTop: 12 }} />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Channel memberships</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>3 active subscribers · $14.97/mo recurring</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
            Member ($4.99) and VIP ($9.99) tiers on your public profile.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  sub: { marginBottom: 16, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', padding: 14 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  cardTitle: { fontWeight: '700', fontSize: 15 },
  cardSub: { fontSize: 13 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100, marginTop: 12 },
  bar: { flex: 1, borderRadius: 4, opacity: 0.85 },
  videoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
});
