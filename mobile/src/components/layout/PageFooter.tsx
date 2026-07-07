import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/theme/tokens';

const LINKS = [
  { label: 'Help', route: '/help' },
  { label: 'Advertise', route: '/advertise' },
  { label: 'Premium', route: '/premium' },
  { label: 'Terms', route: '/terms' },
  { label: 'Privacy', route: '/privacy' },
] as const;

export function PageFooter() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Prysym TV</Text>
      <Text style={styles.tag}>Watch. Create. Connect.</Text>
      <View style={styles.links}>
        {LINKS.map((l) => (
          <Pressable key={l.route} onPress={() => router.push(l.route as never)}>
            <Text style={styles.link}>{l.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.copy}>© {new Date().getFullYear()} Prysym TV</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.page,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  brand: { color: colors.foreground, fontWeight: '800', fontSize: 16 },
  tag: { color: colors.mutedForeground, fontSize: 12 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 8 },
  link: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  copy: { color: colors.mutedForeground, fontSize: 11, marginTop: 8 },
});
