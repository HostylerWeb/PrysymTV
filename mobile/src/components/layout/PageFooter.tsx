import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const SECTIONS = [
  {
    title: 'Discover',
    links: [
      { label: 'Help', route: '/help' },
      { label: 'Impact', route: '/impact' },
      { label: 'Advertise', route: '/advertise' },
    ],
  },
  {
    title: 'Memberships',
    links: [
      { label: 'Premium', route: '/premium' },
      { label: 'Insider', route: '/insider' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', route: '/terms' },
      { label: 'Privacy', route: '/privacy' },
      { label: 'Cookies', route: '/cookies' },
      { label: 'Guidelines', route: '/guidelines' },
    ],
  },
] as const;

export function PageFooter() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { borderTopColor: colors.border, backgroundColor: colors.muted }]}>
      <View style={styles.brandBlock}>
        <Text style={[styles.brand, { color: colors.foreground }]}>Prysym TV</Text>
        <Text style={[styles.tag, { color: colors.mutedForeground }]}>Watch. Create. Connect.</Text>
      </View>

      <View style={styles.grid}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.column}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title}</Text>
            {section.links.map((link) => (
              <Pressable
                key={link.route}
                style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.65 }]}
                onPress={() => router.push(link.route as never)}
              >
                <Text style={[styles.link, { color: colors.foreground }]}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.supportBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={() => void Linking.openURL('mailto:support@prysym.tv')}
      >
        <Text style={[styles.support, { color: colors.primary }]}>support@prysym.tv</Text>
      </Pressable>

      <Text style={[styles.copy, { color: colors.mutedForeground }]}>
        © {new Date().getFullYear()} Prysym TV
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xl,
    marginHorizontal: -spacing.page,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brand: { fontWeight: '800', fontSize: 20, letterSpacing: -0.4 },
  tag: { fontSize: 13, marginTop: 4 },
  grid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 10,
    textAlign: 'center',
  },
  linkRow: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  link: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  supportBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  support: { fontSize: 13, fontWeight: '600' },
  copy: { fontSize: 11, marginTop: spacing.md, textAlign: 'center' },
});
