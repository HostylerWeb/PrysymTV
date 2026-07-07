import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AdvertiserRegisterModal } from '@/components/modals/AdvertiserRegisterModal';
import { PageFooter } from '@/components/layout/PageFooter';
import { useMockAuth } from '@/context/MockAuthContext';
import { mockAdvertiserAccounts, mockAdvertiserPending } from '@/mocks/monetization';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';

const STEPS = [
  { n: '1', title: 'Register your business', body: 'Create an advertiser account with your company name and contact details.' },
  { n: '2', title: 'Get verified', body: 'Our team reviews your account to protect viewers and maintain brand safety.' },
  { n: '3', title: 'Launch campaigns', body: 'Work with Prysym TV on budget, placement, creative, and targeting goals.' },
  { n: '4', title: 'Measure results', body: 'Track impressions, clicks, CTR, and spend from your advertiser portal.' },
];

const PLACEMENTS = [
  { title: 'Home banner', body: 'High-visibility sponsored banner on the home feed.' },
  { title: 'Shorts interstitial', body: 'Full-screen ads between Shorts swipes.' },
  { title: 'Movie preroll', body: 'Pre-roll before long-form movies.' },
  { title: 'Vertical episode gate', body: 'Sponsored moment before the next micro-drama episode.' },
];

export default function AdvertiseScreen() {
  const { register } = useLocalSearchParams<{ register?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, requireAuth, user } = useMockAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<typeof mockAdvertiserPending | null>(null);
  const [verified] = useState(mockAdvertiserAccounts);

  useEffect(() => {
    if (register === '1') setModalOpen(true);
  }, [register]);

  const openRegister = () => {
    requireAuth(() => setModalOpen(true));
  };

  return (
    <>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Advertise" showSearch={false} showNotifications={false} />

          <View style={styles.eyebrowRow}>
            <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
            <Text style={[styles.eyebrow, { color: colors.primary }]}>For advertisers</Text>
          </View>
          <Text style={[styles.hero, { color: colors.foreground }]}>Advertise on Prysym TV</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>
            Reach engaged viewers across video, Shorts, movies, live streams, and vertical series.
          </Text>

          {isAuthenticated && (
            <Card style={{ marginBottom: 16, padding: 14 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                Signed in as{' '}
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  {user?.displayName ?? user?.username}
                </Text>
              </Text>
              {verified.map((account) => (
                <Pressable
                  key={account.id}
                  onPress={() => router.push(`/advertise/portal/${account.id}`)}
                  style={[styles.accountCard, { borderColor: colors.success + '40', backgroundColor: colors.success + '08' }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>{account.companyName}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{account.contactEmail}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>
                      {account.campaignCount} campaigns · Verified · View portal
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
              {pending && (
                <View style={[styles.accountCard, { borderColor: colors.warning + '40', backgroundColor: colors.warning + '08' }]}>
                  <Text style={{ color: colors.foreground, fontWeight: '700' }}>{pending.companyName}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Under review</Text>
                </View>
              )}
            </Card>
          )}

          {!isAuthenticated && (
            <Card style={{ marginBottom: 16, padding: 14, borderColor: colors.warning + '30' }}>
              <Text style={{ color: colors.warning, fontSize: 13, lineHeight: 19 }}>
                Sign in to register as an advertiser. You&apos;ll return here after logging in.
              </Text>
            </Card>
          )}

          <Button
            label={pending ? 'View pending request' : verified.length ? 'Register another business' : 'Register advertiser account'}
            onPress={openRegister}
          />
          <Button
            label="Contact sales"
            variant="secondary"
            style={{ marginTop: 10 }}
            onPress={() => void Linking.openURL('mailto:ads@prysym.tv')}
          />

          <Text style={[styles.section, { color: colors.foreground }]}>How it works</Text>
          {STEPS.map((s) => (
            <View key={s.n} style={styles.step}>
              <Text style={[styles.stepN, { backgroundColor: colors.primary + '25', color: colors.primary }]}>{s.n}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>{s.title}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>{s.body}</Text>
              </View>
            </View>
          ))}

          <Text style={[styles.section, { color: colors.foreground }]}>Ad placements</Text>
          {PLACEMENTS.map((p) => (
            <View key={p.title} style={[styles.placement, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{p.title}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>{p.body}</Text>
            </View>
          ))}

          <PageFooter />
        </View>
      </ScrollView>
      <AdvertiserRegisterModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        hasPending={!!pending}
        pendingAccount={pending}
        onSubmitted={(data) => setPending({ ...mockAdvertiserPending, companyName: data.companyName, contactEmail: data.contactEmail })}
        onCancelPending={() => setPending(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  eyebrow: { ...typography.eyebrow },
  hero: { ...typography.hero, fontSize: 28, marginTop: 8, marginBottom: 8 },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  section: { ...typography.h2, marginTop: 28, marginBottom: 12 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stepN: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, fontWeight: '800', fontSize: 12 },
  placement: { padding: 14, borderRadius: radius.lg, marginBottom: 8, borderWidth: 1 },
});
