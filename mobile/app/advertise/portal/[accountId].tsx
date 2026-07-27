import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { AdvertiserCampaignFormModal } from '@/components/modals/AdvertiserCampaignFormModal';
import {
  fetchAdvertiserAccount,
  fetchAdvertiserCampaignAnalytics,
  updateAdvertiserCampaign,
  type AdvertiserCampaign,
} from '@/lib/api/advertisers';
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
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const accountQuery = useQuery({
    queryKey: ['advertisers', 'me', accountId],
    queryFn: () => fetchAdvertiserAccount(accountId!),
    enabled: Boolean(accountId),
  });

  const account = accountQuery.data;
  const campaigns = account?.campaigns ?? [];
  const [selectedId, setSelectedId] = useState('');
  const selected = campaigns.find((c) => c.id === (selectedId || campaigns[0]?.id)) ?? campaigns[0];
  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdvertiserCampaign | null>(null);

  useEffect(() => {
    if (campaigns[0] && !selectedId) setSelectedId(campaigns[0].id);
  }, [campaigns, selectedId]);

  const analyticsQuery = useQuery({
    queryKey: ['advertisers', 'me', accountId, 'campaigns', selected?.id, 'analytics'],
    queryFn: () => fetchAdvertiserCampaignAnalytics(accountId!, selected!.id),
    enabled: Boolean(accountId && selected?.id),
  });

  const analytics = analyticsQuery.data;

  const refresh = () => {
    void accountQuery.refetch();
    void analyticsQuery.refetch();
  };

  const openCreate = () => {
    setEditingCampaign(null);
    setFormOpen(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setEditingCampaign(selected);
    setFormOpen(true);
  };

  const togglePause = async () => {
    if (!selected || !accountId) return;
    const nextStatus = selected.status === 'active' ? 'paused' : 'active';
    try {
      await updateAdvertiserCampaign(accountId, selected.id, { status: nextStatus });
      refresh();
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Could not update campaign status');
    }
  };

  if (accountQuery.isLoading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Advertiser portal" showSearch={false} showNotifications={false} />

          <FeedQueryState isError={accountQuery.isError} error={accountQuery.error} onRetry={() => void accountQuery.refetch()}>
            {account ? (
              <>
                <View style={styles.headerRow}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="business-outline" size={26} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eyebrow, { color: colors.primary }]}>
                      {account.isVerified ? 'Verified advertiser' : 'Pending verification'}
                    </Text>
                    <Text style={[styles.company, { color: colors.foreground }]}>{account.companyName}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{account.contactEmail}</Text>
                  </View>
                </View>

                <View style={styles.campaignActions}>
                  <Text style={[styles.section, { color: colors.mutedForeground, marginBottom: 0 }]}>Campaigns</Text>
                  {account.isVerified ? (
                    <Button label="New campaign" size="sm" onPress={openCreate} />
                  ) : null}
                </View>

                {campaigns.length === 0 ? (
                  <Text style={{ color: colors.mutedForeground, marginBottom: 16 }}>
                    No campaigns yet.{account.isVerified ? ' Create your first draft campaign.' : ''}
                  </Text>
                ) : (
                  campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      active={campaign.id === selected?.id}
                      colors={colors}
                      onPress={() => setSelectedId(campaign.id)}
                    />
                  ))
                )}

                {selected && account.isVerified ? (
                  <View style={styles.editRow}>
                    <Button label="Edit campaign" variant="secondary" size="sm" onPress={openEdit} />
                    {(selected.status === 'active' || selected.status === 'paused') ? (
                      <Button
                        label={selected.status === 'active' ? 'Pause' : 'Resume'}
                        variant="outline"
                        size="sm"
                        onPress={() => void togglePause()}
                      />
                    ) : null}
                  </View>
                ) : null}

                {selected ? (
                  <>
                    <Text style={[styles.section, { color: colors.mutedForeground, marginTop: 20 }]}>Analytics</Text>
                    {analyticsQuery.isLoading ? (
                      <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                    ) : null}
                    {analytics ? (
                      <>
                        <Card style={{ padding: 16 }}>
                          <Text style={[styles.analyticsTitle, { color: colors.foreground }]}>{analytics.campaign.title}</Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16, textTransform: 'capitalize' }}>
                            {placementLabel(analytics.campaign.placement)} · {analytics.campaign.status}
                          </Text>
                          <View style={styles.metricsGrid}>
                            <Metric label="Impressions" value={analytics.summary.servedImpressions.toLocaleString()} colors={colors} />
                            <Metric label="Clicks" value={analytics.summary.clicks.toLocaleString()} colors={colors} />
                            <Metric label="CTR" value={`${analytics.summary.ctrPercent.toFixed(2)}%`} colors={colors} />
                            <Metric label="Delivery" value={`${analytics.summary.deliveryPercent.toFixed(1)}%`} colors={colors} />
                          </View>
                        </Card>

                        <View style={styles.budgetGrid}>
                          <Card style={styles.budgetCard}>
                            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Budget</Text>
                            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                              ${analytics.summary.budgetUsd.toLocaleString()}
                            </Text>
                          </Card>
                          <Card style={styles.budgetCard}>
                            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Spent</Text>
                            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                              ${analytics.summary.spentUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Text>
                          </Card>
                          <Card style={styles.budgetCard}>
                            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Remaining</Text>
                            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800', marginTop: 4 }}>
                              ${analytics.summary.budgetRemainingUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Text>
                          </Card>
                        </View>

                        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 12, lineHeight: 18 }}>
                          Campaign runs {new Date(analytics.campaign.startsAt).toLocaleDateString()} – {new Date(analytics.campaign.endsAt).toLocaleDateString()}. CPM basis: ${analytics.summary.cpmUsd.toFixed(2)}.
                        </Text>
                      </>
                    ) : analyticsQuery.isError ? (
                      <Text style={{ color: colors.mutedForeground }}>Could not load analytics.</Text>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
          </FeedQueryState>

          <Button
            label="Contact account manager"
            variant="secondary"
            style={{ marginTop: 24 }}
            onPress={() => router.push('/advertise')}
          />
        </View>
      </ScrollView>

      {accountId ? (
        <AdvertiserCampaignFormModal
          visible={formOpen}
          onClose={() => setFormOpen(false)}
          accountId={accountId}
          campaign={editingCampaign}
          onSaved={() => {
            void queryClient.invalidateQueries({ queryKey: ['advertisers', 'me', accountId] });
            refresh();
          }}
        />
      ) : null}
    </>
  );
}

function CampaignCard({
  campaign,
  active,
  colors,
  onPress,
}: {
  campaign: AdvertiserCampaign;
  active: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  const st = statusStyle(campaign.status, colors);
  return (
    <Pressable
      onPress={onPress}
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
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: spacing.page },
  headerRow: { flexDirection: 'row', gap: 14, marginTop: 8, marginBottom: 20 },
  iconBox: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  company: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  section: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  campaignActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  editRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 4 },
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
