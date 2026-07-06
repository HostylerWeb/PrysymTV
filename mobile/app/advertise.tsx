import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AdvertiserRegisterModal } from '@/components/modals/AdvertiserRegisterModal';
import { colors, radius, typography } from '@/theme/tokens';

const STEPS = [
  { n: '1', title: 'Register your business', body: 'Company name and contact details.' },
  { n: '2', title: 'Get verified', body: 'Our team reviews your account for brand safety.' },
  { n: '3', title: 'Launch campaigns', body: 'Work with Prysym TV on budget, placement, and creative.' },
  { n: '4', title: 'Measure results', body: 'Track impressions, clicks, CTR, and spend.' },
];

const PLACEMENTS = ['Home banner', 'Shorts interstitial', 'Movie preroll', 'Vertical episode gate'];

export default function AdvertiseScreen() {
  const { register } = useLocalSearchParams<{ register?: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (register === '1') setModalOpen(true);
  }, [register]);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.pad}>
          <AppHeader showBack title="Advertise" showSearch={false} showNotifications={false} />
          <Text style={styles.hero}>Advertise on Prysym TV</Text>
          <Text style={styles.sub}>
            Reach engaged viewers across video, Shorts, movies, live streams, and vertical series.
          </Text>

          {hasPending ? (
            <Card>
              <Text style={styles.cardTitle}>Pending registration</Text>
              <Text style={styles.cardSub}>Your business is under review.</Text>
              <Button label="View / cancel request" variant="outline" onPress={() => setModalOpen(true)} style={{ marginTop: 12 }} />
            </Card>
          ) : (
            <Button label="Register advertiser account" onPress={() => setModalOpen(true)} />
          )}

          <Text style={styles.section}>How it works</Text>
          {STEPS.map((s) => (
            <View key={s.n} style={styles.step}>
              <Text style={styles.stepN}>{s.n}</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepText}>{s.body}</Text>
              </View>
            </View>
          ))}

          <Text style={styles.section}>Ad placements</Text>
          {PLACEMENTS.map((p) => (
            <View key={p} style={styles.placement}>
              <Text style={styles.placementTitle}>{p}</Text>
            </View>
          ))}

          <Text style={styles.section}>Pricing & reporting</Text>
          <Card>
            <Text style={styles.cardTitle}>CPM and budget controls</Text>
            <Text style={styles.cardSub}>Campaigns run against defined budget and CPM until exhausted.</Text>
          </Card>

          <Button label="Contact sales" variant="secondary" style={{ marginTop: 16 }} />
        </View>
      </ScrollView>
      <AdvertiserRegisterModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        hasPending={hasPending}
        onSubmitted={() => setHasPending(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  hero: { ...typography.hero, fontSize: 28, color: colors.foreground, marginBottom: 8 },
  sub: { color: colors.mutedForeground, lineHeight: 20, marginBottom: 20 },
  section: { ...typography.h2, color: colors.foreground, marginTop: 28, marginBottom: 12 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepN: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + '30', color: colors.primary, textAlign: 'center', lineHeight: 28, fontWeight: '800', fontSize: 12 },
  stepBody: { flex: 1 },
  stepTitle: { color: colors.foreground, fontWeight: '700' },
  stepText: { color: colors.mutedForeground, fontSize: 13, marginTop: 2 },
  placement: { padding: 12, backgroundColor: colors.card, borderRadius: radius.md, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  placementTitle: { color: colors.foreground, fontWeight: '600' },
  cardTitle: { color: colors.foreground, fontWeight: '700' },
  cardSub: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
});
