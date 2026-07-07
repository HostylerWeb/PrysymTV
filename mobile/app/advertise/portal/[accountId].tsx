import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { mockAdvertiserCampaigns } from '@/mocks/monetization';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';

function placementLabel(placement: string) {
  return placement.replace(/_/g, ' ');
}

function statusStyle(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'active') return { bg: colors.success + '20', text: colors.success };
  if (status === 'paused') return { bg: colors.warning + '20', text: colors.warning };
  return { bg: colors.muted, text: colors.mutedForeground };
}

export default function AdvertiserPortalScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const campaigns = mockAdvertiserCampaigns[accountId ?? 'adv-demo-1'] ?? [];
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id ?? '');
  const selected = campaigns.find((c) => c.id === selectedId) ?? campaigns[0];

  const ctr = selected && selected.deliveredImpressions > 0
    ? (selected.clicks / selected.deliveredImpressions) * 100
    : 0;
  const delivery = selected && selected.targetImpressions > 0
    ? (selected.deliveredImpressions / selected.targetImpressions) * 100
    : 0;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Advertiser portal" showSearch={false} showNotifications={false} />

        <View style={styles.headerRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="business-outline" size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>Verified advertiser</Text>
            <Text style={[styles.company, { color: colors.foreground }]}>Acme Brands</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>ads@acme.com</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>Campaigns</Text>
        {campaigns.map((campaign) => {
          const active = campaign.id === selectedId;
          const st = statusStyle(campaign.status, colors);
          return (
            <Pressable
              key={campaign.id}
              onPress={() => setSelectedId(campaign.id)}
              style={[
                styles.campaignCard,
                {
                  borderColor: active ? colors.primary + '50' : colors.border,
                  backgroundColor: active ? colors.primary + '08' : colors.card,
                },
              ]}
            >
              <View style={styles.campaignTop}>
                <Text style={[styles.campaignTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {campaign.title}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, textTransform: 'capitalize', marginTop: 2 }}>
                {placementLabel(campaign.placement)}
              </Text>
              <View style={styles.campaignMeta}>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Text style={{ color: st.text, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                    {campaign.status}
                  </Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                  {campaign.deliveredImpressions.toLocaleString()} / {campaign.targetImpressions.toLocaleString()} imps
                </Text>
              </View>
            </Pressable>
          );
        })}

        {selected && (
          <>
            <Text style={[styles.section, { color: colors.mutedForeground, marginTop: 20 }]}>Analytics</Text>
            <Card style={{ padding: 16 }}>
              <Text style={[styles.analyticsTitle, { color: colors.foreground }]}>{selected.title}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16, textTransform: 'capitalize' }}>
                {placementLabel(selected.placement)} · {selected.status}
              </Text>
              <View style={styles.metricsGrid}>
                <Metric label="Impressions" value={selected.deliveredImpressions.toLocaleString()} colors={colors} />
                <Metric label="Clicks" value={selected.clicks.toLocaleString()} colors={colors} />
                <Metric label="CTR" value={`${ctr.toFixed(2)}%`} colors={colors} />
                <Metric label="Delivery" value={`${delivery.toFixed(1)}%`} colors={colors} />
              </View>
            </Card>

            <View style={styles.budgetGrid}>
              <Card style={styles.budgetCard}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Budget</Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                  ${selected.budgetUsd.toLocaleString()}
                </Text>
              </Card>
              <Card style={styles.budgetCard}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Spent</Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                  ${selected.spentUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </Card>
              <Card style={styles.budgetCard}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Remaining</Text>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                  ${Math.max(0, selected.budgetUsd - selected.spentUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </Card>
            </View>

            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 12, lineHeight: 18 }}>
              Campaign runs {new Date(selected.startsAt).toLocaleDateString()} – {new Date(selected.endsAt).toLocaleDateString()}.
            </Text>
          </>
        )}

        <Button
          label="Contact account manager"
          variant="secondary"
          style={{ marginTop: 24 }}
          onPress={() => router.push('/advertise')}
        />
      </View>
    </ScrollView>
  );
}

function Metric({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ width: '48%', marginBottom: 12 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  headerRow: { flexDirection: 'row', gap: 14, marginTop: 8, marginBottom: 20 },
  iconBox: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  company: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  section: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  campaignCard: { borderWidth: 1, borderRadius: radius.xl, padding: 14, marginBottom: 8 },
  campaignTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  campaignTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  campaignMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  analyticsTitle: { fontSize: 18, fontWeight: '800' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  budgetGrid: { flexDirection: 'row', gap: 8, marginTop: 12 },
  budgetCard: { flex: 1, padding: 12 },
});
