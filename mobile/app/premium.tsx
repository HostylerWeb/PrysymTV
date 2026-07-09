import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CoinsModal } from '@/components/modals/CoinsModal';
import { useMockAuth } from '@/context/MockAuthContext';
import {
  cancelSubscription,
  createPremiumCheckout,
  fetchBillingProducts,
  fetchMySubscriptions,
  type CoinPackage,
} from '@/lib/api/billing';
import type { CreatorSubscription } from '@/lib/api/billing-monetization';
import { runBillingCheckout } from '@/lib/billing-checkout';
import { isPremiumActive } from '@/lib/premium';
import {
  INSIDER_PERKS,
  MEMBERSHIP_PRICES,
  PREMIUM_PERKS,
} from '@/mocks/monetization';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';

export default function PremiumScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, requireAuth, refreshUser } = useMockAuth();
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<CreatorSubscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const premiumActive = isPremiumActive(user?.premiumTier, user?.premiumExpiresAt);
  const premiumPrice = `$${MEMBERSHIP_PRICES.premium.toFixed(2)}/mo`;

  const load = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const [products, subs] = await Promise.all([
        fetchBillingProducts().catch(() => [] as CoinPackage[]),
        fetchMySubscriptions().catch(() => ({ items: [] as CreatorSubscription[] })),
      ]);
      setPackages(products);
      setSubscriptions(subs.items);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    void fetchBillingProducts().then(setPackages).catch(() => setPackages([]));
  }, []);

  const subscribePremium = () => {
    requireAuth(async () => {
      setBusy(true);
      setError(null);
      try {
        const res = await createPremiumCheckout('premium');
        const result = await runBillingCheckout(res, () => refreshUser());
        if (!result.ok) setError(result.error ?? 'Checkout failed');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout failed');
      } finally {
        setBusy(false);
      }
    });
  };

  const cancelChannelSub = (sub: CreatorSubscription) => {
    Alert.alert(
      'Cancel membership',
      `Cancel your membership with @${sub.creator?.username ?? 'creator'}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await cancelSubscription(sub.id);
                setSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Could not cancel');
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Memberships" showSearch={false} showNotifications={false} />

          <Text style={[styles.hero, { color: colors.foreground }]}>Support Prysym TV</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Platform memberships are separate from channel memberships on creator profiles.
          </Text>
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

          <Card style={[styles.heroCard, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]}>
            <Text style={[styles.badge, { color: colors.primary }]}>Prysym Membership</Text>
            <Text style={[styles.price, { color: colors.foreground }]}>
              ${MEMBERSHIP_PRICES.premium.toFixed(2)}
              <Text style={styles.per}>/month</Text>
            </Text>
            {PREMIUM_PERKS.map((p) => (
              <Text key={p} style={[styles.perk, { color: colors.mutedForeground }]}>✓ {p}</Text>
            ))}
            {premiumActive ? (
              <View style={[styles.activePill, { backgroundColor: colors.success + '20' }]}>
                <Text style={{ color: colors.success, fontWeight: '700' }}>Active — ad-free viewing enabled</Text>
                {user?.premiumExpiresAt ? (
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                    Renews {new Date(user.premiumExpiresAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Button
                label={busy ? 'Processing…' : `Subscribe — ${premiumPrice}`}
                style={{ marginTop: 16 }}
                disabled={busy}
                onPress={subscribePremium}
              />
            )}
          </Card>

          <Pressable
            onPress={() => router.push('/insider')}
            style={[styles.insiderLink, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 15 }}>Platform Insider</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
                Roadmaps, town halls & platform voice — ${MEMBERSHIP_PRICES.insider.toFixed(2)}/mo
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 6 }}>
                {INSIDER_PERKS[0]} · {INSIDER_PERKS[1]}
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>View</Text>
          </Pressable>

          <Text style={[styles.section, { color: colors.foreground }]}>Your channel memberships</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Support creators monthly — manage from creator profiles or below.
          </Text>
          {loadingSubs ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : subscriptions.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 8 }}>
              No active channel memberships yet.
            </Text>
          ) : (
            subscriptions.map((sub) => (
              <Card key={sub.id} style={styles.channelCard}>
                <View style={styles.channelRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>
                      @{sub.creator?.username ?? 'creator'}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                      {sub.tier === 'premium' ? 'VIP' : 'Member'} · {sub.status}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                      Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ gap: 8 }}>
                    {sub.creator?.username ? (
                      <Button
                        label="View"
                        variant="outline"
                        onPress={() => router.push(`/creator/${sub.creator!.username}`)}
                      />
                    ) : null}
                    <Button label="Cancel" variant="ghost" onPress={() => cancelChannelSub(sub)} />
                  </View>
                </View>
              </Card>
            ))
          )}

          <Text style={[styles.section, { color: colors.foreground }]}>Coins</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Send gifts during live streams.</Text>
          {packages.length === 0 ? (
            <Card style={styles.pack}>
              <Text style={{ color: colors.mutedForeground }}>Coin packages load at checkout.</Text>
              <Button label="Buy coins" variant="secondary" onPress={() => setCoinsOpen(true)} />
            </Card>
          ) : (
            packages.map((p) => (
              <Card key={p.id} style={styles.pack}>
                <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 16 }}>
                  🪙 {p.coins.toLocaleString()}
                </Text>
                <Text style={{ color: colors.mutedForeground }}>
                  ${typeof p.priceUsd === 'number' ? p.priceUsd.toFixed(2) : p.priceUsd}
                </Text>
                <Button label="Buy" variant="secondary" onPress={() => setCoinsOpen(true)} />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
      <CoinsModal
        visible={coinsOpen}
        onClose={() => setCoinsOpen(false)}
        balance={user?.coinsBalance ?? 0}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  hero: { ...typography.h1, marginTop: 8 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 },
  error: { fontSize: 13, marginBottom: 8 },
  heroCard: { padding: 20, borderWidth: 1, marginBottom: 12 },
  badge: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  price: { fontSize: 36, fontWeight: '900', marginVertical: 12 },
  per: { fontSize: 16, fontWeight: '400' },
  perk: { fontSize: 14, marginTop: 8 },
  activePill: { marginTop: 16, padding: 12, borderRadius: radius.lg, alignItems: 'center' },
  insiderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: 8,
  },
  section: { ...typography.h2, marginTop: 24, marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 12 },
  channelCard: { marginBottom: 8, padding: 14 },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pack: { marginBottom: 10, gap: 8, padding: 14 },
});
