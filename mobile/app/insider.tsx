import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useMockAuth } from '@/context/MockAuthContext';
import { createInsiderCheckout } from '@/lib/api/billing';
import { runBillingCheckout } from '@/lib/billing-checkout';
import { isInsiderActive } from '@/lib/premium';
import { usePublicMembershipConfig } from '@/hooks/api/usePublicMembershipConfig';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';

export default function InsiderScreen() {
  const { colors } = useTheme();
  const { user, requireAuth, refreshUser } = useMockAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribed = isInsiderActive(user?.insiderActive, user?.insiderPeriodEnd);
  const { insider } = usePublicMembershipConfig();
  const insiderPerks = insider?.perks ?? ['Roadmaps & early access', 'Town halls', 'Platform voice'];
  const priceLabel = insider ? `$${insider.priceUsd.toFixed(2)}/mo` : 'See checkout';

  const join = () => {
    requireAuth(async () => {
      setBusy(true);
      setError(null);
      try {
        const res = await createInsiderCheckout();
        const result = await runBillingCheckout(res, () => refreshUser());
        if (!result.ok) setError(result.error ?? 'Checkout failed');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout failed');
      } finally {
        setBusy(false);
      }
    });
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Platform Insider" showSearch={false} showNotifications={false} />
        {error ? <Text style={{ color: colors.destructive, marginTop: 8 }}>{error}</Text> : null}

        {subscribed ? (
          <Card style={[styles.hero, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '10' }]}>
            <Text style={{ fontSize: 36, textAlign: 'center' }}>✓</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground, textAlign: 'center' }]}>
              You&apos;re a Platform Insider
            </Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground, textAlign: 'center' }]}>
              Early access to roadmaps, town halls, and insider-only updates. This is separate from Premium (ad-free viewing).
            </Text>
            {user?.insiderPeriodEnd ? (
              <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 8, fontSize: 13 }}>
                Active until {new Date(user.insiderPeriodEnd).toLocaleDateString()}
              </Text>
            ) : null}
          </Card>
        ) : (
          <>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>Platform Insider</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              Shape the future of Prysym TV
            </Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              A separate membership from Premium. Insider gives you a voice in product direction — not ad-free viewing.
            </Text>

            <Card style={[styles.planCard, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '08' }]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.foreground }]}>Platform Insider</Text>
                <Text style={[styles.planPrice, { color: colors.foreground }]}>{priceLabel}</Text>
              </View>
              {insiderPerks.map((perk) => (
                <Text key={perk} style={[styles.perk, { color: colors.mutedForeground }]}>
                  ✓ {perk}
                </Text>
              ))}
              <Button
                label={busy ? 'Processing…' : `Join Insider — ${priceLabel}`}
                style={{ marginTop: 16 }}
                disabled={busy}
                onPress={join}
              />
            </Card>

            <Card style={{ marginTop: 16, padding: 14 }}>
              <Text style={{ color: colors.foreground, fontWeight: '700', marginBottom: 4 }}>Premium vs Insider</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>
                <Text style={{ fontWeight: '700', color: colors.foreground }}>Premium</Text> removes ads across Shorts, Verticals, and Movies.{' '}
                <Text style={{ fontWeight: '700', color: colors.foreground }}>Insider</Text> unlocks roadmaps, town halls, and voting — you can subscribe to one or both.
              </Text>
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  eyebrow: { ...typography.eyebrow, marginTop: 8 },
  hero: { marginTop: 16, padding: 24 },
  heroTitle: { ...typography.h1, marginTop: 8 },
  heroSub: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 16 },
  planCard: { padding: 20, borderWidth: 1, borderRadius: radius.xl },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planName: { fontSize: 18, fontWeight: '800' },
  planPrice: { fontSize: 18, fontWeight: '900' },
  perk: { fontSize: 14, marginTop: 8, lineHeight: 20 },
});
