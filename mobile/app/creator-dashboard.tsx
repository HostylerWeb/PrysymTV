import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useCreatorDashboard } from '@/hooks/api/useCreatorDashboard';
import { requestCreatorPayout } from '@/lib/api/billing-monetization';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

function fmtUsd(v: string) {
  const n = Number(v);
  return Number.isFinite(n)
    ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';
}

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { dashboard, balance, isLoading, isError, error, refetch } = useCreatorDashboard();
  const [payoutBusy, setPayoutBusy] = useState(false);

  const requestPayout = () => {
    const available = Number(balance?.availableUsd ?? dashboard?.financial.availableBalanceUsd ?? 0);
    const minimum = Number(balance?.minimumPayoutUsd ?? 50);
    if (available < minimum) {
      Alert.alert('Payout', `Minimum payout is ${fmtUsd(String(minimum))}. Available: ${fmtUsd(String(available))}.`);
      return;
    }
    Alert.alert('Request payout', `Withdraw ${fmtUsd(String(available))}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request',
        onPress: () => {
          void (async () => {
            setPayoutBusy(true);
            try {
              await requestCreatorPayout(available);
              Alert.alert('Payout requested', 'Your payout request was submitted.');
              refetch();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not request payout');
            } finally {
              setPayoutBusy(false);
            }
          })();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Creator dashboard" showSearch={false} showNotifications={false} />
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Performance, earnings, and community impact from your content.
        </Text>

        <FeedQueryState isError={isError} error={error} onRetry={() => refetch()}>
          {dashboard ? (
            <>
              <View style={styles.grid}>
                <Card style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Views (24h)</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {formatViewCount(dashboard.performance.views24h)}
                  </Text>
                </Card>
                <Card style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Views (7d)</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {formatViewCount(dashboard.performance.views7d)}
                  </Text>
                </Card>
                <Card style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Earnings (30d)</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {fmtUsd(dashboard.financial.earnings30dUsd)}
                  </Text>
                </Card>
                <Card style={styles.stat}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Coins received (30d)</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    🪙 {dashboard.gifts.coinsReceived30d.toLocaleString()}
                  </Text>
                </Card>
              </View>

              <Card style={{ marginTop: 16, padding: 16, borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Community impact (GAF)</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground, marginTop: 4 }]}>
                  Your content contributed {fmtUsd(dashboard.communityImpact.dollarsInvested)} to community programs.
                </Text>
                <Button label="View public impact report" variant="outline" style={{ marginTop: 12 }} onPress={() => router.push('/impact')} />
              </Card>

              <Card style={{ marginTop: 16 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Top content</Text>
                {dashboard.topContent.length === 0 ? (
                  <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>No content yet.</Text>
                ) : (
                  dashboard.topContent.slice(0, 5).map((v) => (
                    <View key={v.id} style={[styles.videoRow, { borderBottomColor: colors.border }]}>
                      <Text style={{ color: colors.foreground, flex: 1 }}>{v.title}</Text>
                      <Text style={{ color: colors.mutedForeground }}>{formatViewCount(v.viewsCount)}</Text>
                    </View>
                  ))
                )}
              </Card>

              <Card style={{ marginTop: 16 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Payouts</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  Available: {fmtUsd(balance?.availableUsd ?? dashboard.financial.availableBalanceUsd)} · Min withdrawal{' '}
                  {fmtUsd(balance?.minimumPayoutUsd ?? '50')}
                </Text>
                <Button
                  label={payoutBusy ? 'Submitting…' : 'Request payout'}
                  variant="secondary"
                  style={{ marginTop: 12 }}
                  disabled={payoutBusy}
                  onPress={requestPayout}
                />
              </Card>

              <Card style={{ marginTop: 16 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Gifts (30d)</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  {dashboard.gifts.giftCount30d} gifts · {fmtUsd(dashboard.gifts.earnings30dUsd)} your share (
                  {dashboard.gifts.creatorSharePercent}%)
                </Text>
              </Card>
            </>
          ) : null}
        </FeedQueryState>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: spacing.page },
  sub: { marginBottom: 16, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', padding: 14 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  cardTitle: { fontWeight: '700', fontSize: 15 },
  cardSub: { fontSize: 13 },
  videoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
});
