import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { INSIDER_PERKS, MEMBERSHIP_PRICES } from '@/mocks/monetization';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, typography } from '@/theme/tokens';

export default function InsiderScreen() {
  const { colors } = useTheme();
  const [subscribed, setSubscribed] = useState(false);
  const priceLabel = `$${MEMBERSHIP_PRICES.insider.toFixed(2)}/mo`;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Platform Insider" showSearch={false} showNotifications={false} />

        {subscribed ? (
          <Card style={[styles.hero, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '10' }]}>
            <Text style={{ fontSize: 36, textAlign: 'center' }}>✓</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground, textAlign: 'center' }]}>
              You&apos;re a Platform Insider
            </Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground, textAlign: 'center' }]}>
              Early access to roadmaps, town halls, and insider-only updates. This is separate from Premium (ad-free viewing).
            </Text>
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
              {INSIDER_PERKS.map((perk) => (
                <Text key={perk} style={[styles.perk, { color: colors.mutedForeground }]}>
                  ✓ {perk}
                </Text>
              ))}
              <Button
                label={`Join Insider — ${priceLabel}`}
                style={{ marginTop: 16 }}
                onPress={() => setSubscribed(true)}
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
