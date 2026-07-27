import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageFooter } from '@/components/layout/PageFooter';
import { usePublicMembershipConfig } from '@/hooks/api/usePublicMembershipConfig';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const PROGRAMS = [
  { label: 'Community Impact (GAF)', route: '/impact' },
  { label: 'Premium & memberships', route: '/premium' },
  { label: 'Platform Insider', route: '/insider' },
  { label: 'Advertise with us', route: '/advertise' },
  { label: 'Community Guidelines', route: '/guidelines' },
];

export default function HelpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { channelMembership } = usePublicMembershipConfig();

  const memberPrice = channelMembership?.basic.priceUsd.toFixed(2) ?? '4.99';
  const vipPrice = channelMembership?.premium.priceUsd.toFixed(2) ?? '9.99';

  const faq = useMemo(
    () => [
      { q: 'How do I upload content?', a: 'Tap + on Home or Profile, or go to Settings → Upload.' },
      { q: 'How do I go live?', a: 'Apply for streamer access under Profile → Settings, then Go Live.' },
      { q: 'What is Premium?', a: 'Ad-free Shorts, Verticals, and Movies — separate from channel memberships.' },
      { q: 'What is Platform Insider?', a: 'Roadmaps, town halls, and voting on platform priorities — separate from Premium.' },
      {
        q: 'How do channel memberships work?',
        a: `Subscribe on a creator profile as Member ($${memberPrice}) or VIP ($${vipPrice}) to support that creator.`,
      },
    ],
    [memberPrice, vipPrice],
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <AppHeader showBack title="Help" showSearch={false} showNotifications={false} />
      <View style={styles.pad}>
        <Text style={[styles.section, { color: colors.foreground }]}>FAQ</Text>
        {faq.map((f) => (
          <View key={f.q} style={styles.faq}>
            <Text style={[styles.q, { color: colors.foreground }]}>{f.q}</Text>
            <Text style={[styles.a, { color: colors.mutedForeground }]}>{f.a}</Text>
          </View>
        ))}
        <Text style={[styles.section, { color: colors.foreground }]}>Programs</Text>
        {PROGRAMS.map((p) => (
          <Pressable key={p.route} style={[styles.link, { borderBottomColor: colors.border }]} onPress={() => router.push(p.route as never)}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{p.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => void Linking.openURL('mailto:support@prysym.tv')}>
          <Text style={[styles.contact, { color: colors.mutedForeground }]}>Contact: support@prysym.tv</Text>
        </Pressable>
        <PageFooter />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pad: { paddingHorizontal: spacing.page },
  section: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  faq: { marginBottom: 14 },
  q: { fontWeight: '600' },
  a: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  link: { paddingVertical: 12, borderBottomWidth: 1 },
  linkText: { fontWeight: '600' },
  contact: { marginTop: 24, fontSize: 13 },
});
