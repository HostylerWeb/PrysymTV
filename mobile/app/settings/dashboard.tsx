import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { useCreatorDashboard } from '@/hooks/api/useCreatorDashboard';
import { requestCreatorPayout } from '@/lib/api/billing-monetization';
import { colors, typography } from '@/theme/tokens';
import { formatViewCount } from '@/utils/format-media';

function fmtUsd(v: string) {
  const n = Number(v);
  return Number.isFinite(n)
    ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';
}

export default function SettingsDashboardScreen() {
  const router = useRouter();
  const { dashboard, balance, isLoading, isError, error, refetch } = useCreatorDashboard();
  const [payoutBusy, setPayoutBusy] = useState(false);

  const requestPayout = () => {
    if (!dashboard) return;
    const available = Number(balance?.availableUsd ?? dashboard.financial.availableBalanceUsd);
    const minimum = Number(balance?.minimumPayoutUsd ?? 50);
    if (available < minimum) {
      Alert.alert('Payout', `Minimum payout is ${fmtUsd(String(minimum))}.`);
      return;
    }
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
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Performance & Revenue" showSearch={false} showNotifications={false} />
        <Text style={styles.sub}>Views, watch time, revenue, and subscriber growth for your channel.</Text>

        <FeedQueryState isError={isError} error={error} onRetry={() => refetch()}>
          {dashboard ? (
            <>
              <View style={styles.grid}>
                <Card style={styles.stat}>
                  <Text style={styles.statLabel}>Views (7d)</Text>
                  <Text style={styles.statValue}>{formatViewCount(dashboard.performance.views7d)}</Text>
                </Card>
                <Card style={styles.stat}>
                  <Text style={styles.statLabel}>Watch time (30d)</Text>
                  <Text style={styles.statValue}>{dashboard.performance.watchHours30d}h</Text>
                </Card>
                <Card style={styles.stat}>
                  <Text style={styles.statLabel}>Revenue (30d)</Text>
                  <Text style={styles.statValue}>{fmtUsd(dashboard.financial.earnings30dUsd)}</Text>
                </Card>
                <Card style={styles.stat}>
                  <Text style={styles.statLabel}>Subscribers</Text>
                  <Text style={styles.statValue}>{dashboard.performance.subscribers}</Text>
                </Card>
              </View>
              <Card style={{ marginTop: 16 }}>
                <Text style={styles.cardTitle}>Payouts</Text>
                <Text style={styles.cardSub}>
                  Available balance: {fmtUsd(balance?.availableUsd ?? dashboard.financial.availableBalanceUsd)} · Minimum{' '}
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
            </>
          ) : null}
        </FeedQueryState>

        <Button label="Open full creator dashboard" variant="outline" onPress={() => router.push('/creator-dashboard')} style={{ marginTop: 16 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 16 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%' },
  statLabel: { color: colors.mutedForeground, fontSize: 11 },
  statValue: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 6 },
  cardTitle: { ...typography.h3, color: colors.foreground },
  cardSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
});
