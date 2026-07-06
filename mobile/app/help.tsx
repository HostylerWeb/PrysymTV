import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors } from '@/theme/tokens';

const FAQ = [
  { q: 'How do I upload content?', a: 'Tap + on Home or Profile, or go to Settings → Upload.' },
  { q: 'How do I go live?', a: 'Apply for streamer access under Profile → Settings, then Go Live.' },
  { q: 'Premium benefits?', a: 'Ad-free Shorts, Verticals, Movies, and member badge.' },
];

const PROGRAMS = [
  { label: 'Creator Fund', route: '/premium' },
  { label: 'Advertise with us', route: '/advertise' },
  { label: 'Community Guidelines', route: '/guidelines' },
];

export default function HelpScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <AppHeader showBack title="Help" showSearch={false} showNotifications={false} />
      <Text style={styles.section}>FAQ</Text>
      {FAQ.map((f) => (
        <View key={f.q} style={styles.faq}>
          <Text style={styles.q}>{f.q}</Text>
          <Text style={styles.a}>{f.a}</Text>
        </View>
      ))}
      <Text style={styles.section}>Programs</Text>
      {PROGRAMS.map((p) => (
        <Pressable key={p.route} style={styles.link} onPress={() => router.push(p.route as never)}>
          <Text style={styles.linkText}>{p.label}</Text>
        </Pressable>
      ))}
      <Text style={styles.contact}>Contact: support@prysym.tv (mock)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  section: { color: colors.foreground, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  faq: { marginBottom: 14 },
  q: { color: colors.foreground, fontWeight: '600' },
  a: { color: colors.mutedForeground, fontSize: 14, marginTop: 4, lineHeight: 20 },
  link: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  linkText: { color: colors.primary, fontWeight: '600' },
  contact: { color: colors.mutedForeground, marginTop: 24, fontSize: 13 },
});
