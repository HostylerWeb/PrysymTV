import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius, spacing, typography, withAlpha } from '@/theme/tokens';

const GUEST_PERKS = [
  { icon: 'play-circle-outline' as const, title: 'Watch free', sub: 'Browse videos, movies, shorts, and live streams' },
  { icon: 'search-outline' as const, title: 'Explore creators', sub: 'Discover sports, cooking, finance, education, and more' },
  { icon: 'lock-closed-outline' as const, title: 'Sign in for more', sub: 'Like, comment, save, gift, shop, and create content' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useMockAuth();

  const enterAsGuest = async () => {
    await continueAsGuest();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.heroCard}>
        <View style={styles.glow} />
        <Image source={require('../assets/logo.webp')} style={styles.logo} contentFit="contain" />
        <Text style={styles.eyebrow}>Prysym TV</Text>
        <Text style={styles.title}>Where creators and communities grow together</Text>
        <Text style={styles.sub}>
          Stream sports, cooking, courses, crypto, finance, and more. Sign in to unlock the full experience.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Sign in" onPress={() => router.push('/(auth)/login')} />
        <Button label="Create account" variant="secondary" onPress={() => router.push('/(auth)/register')} />
        <Button label="Continue as guest" variant="ghost" onPress={enterAsGuest} />
      </View>

      <View style={styles.perks}>
        {GUEST_PERKS.map((p) => (
          <View key={p.title} style={styles.perkRow}>
            <View style={styles.perkIcon}>
              <Ionicons name={p.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.perkCopy}>
              <Text style={styles.perkTitle}>{p.title}</Text>
              <Text style={styles.perkSub}>{p.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.page,
  },
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.7),
    backgroundColor: withAlpha(colors.card, 0.6),
    padding: spacing.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: withAlpha(colors.primary, 0.15),
  },
  logo: { width: 140, height: 36, marginBottom: spacing.md },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.foreground,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  sub: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: { gap: 10, marginBottom: spacing.lg },
  perks: { gap: 10 },
  perkRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
  perkCopy: { flex: 1 },
  perkTitle: { color: colors.foreground, fontWeight: '700', fontSize: 14 },
  perkSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 3, lineHeight: 17 },
});
