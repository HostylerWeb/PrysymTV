import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { TvFocusButton } from '@/components/tv/TvFocusButton';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, typography } from '@/theme/tokens';
import { Text } from 'react-native';

const NAV_ITEMS = [
  { href: '/(main)', label: 'Home' },
  { href: '/(main)/videos', label: 'Videos' },
  { href: '/(main)/movies', label: 'Movies' },
  { href: '/(main)/shorts', label: 'Shorts' },
  { href: '/(main)/live', label: 'Live' },
  { href: '/(main)/verticals', label: 'Verticals' },
  { href: '/(main)/podcasts', label: 'Podcasts' },
  { href: '/(main)/search', label: 'Search' },
  { href: '/(main)/history', label: 'History' },
] as const;

export function TvShell() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/(main)') {
      return pathname === '/' || pathname === '/(main)' || pathname.endsWith('/index');
    }
    const segment = href.replace('/(main)', '');
    return pathname.includes(segment);
  };

  return (
    <View style={styles.root}>
      <View style={styles.rail}>
        <Text style={styles.brand}>PrysymTV</Text>
        {NAV_ITEMS.map((item) => (
          <TvFocusButton
            key={item.href}
            label={item.label}
            selected={isActive(item.href)}
            onPress={() => router.push(item.href)}
            style={styles.navButton}
          />
        ))}
        <View style={styles.logoutWrap}>
          <TvFocusButton
            label="Sign out"
            onPress={() => void logout()}
            style={styles.navButton}
          />
        </View>
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  rail: {
    width: 220,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: spacing.sm,
  },
  brand: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '800',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  navButton: {
    width: '100%',
    minWidth: 0,
  },
  logoutWrap: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  content: {
    flex: 1,
  },
});
