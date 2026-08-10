import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet, Text } from 'react-native';
import { Slot, usePathname, useRouter, type Href } from 'expo-router';
import { TvFocusButton } from '@/components/tv/TvFocusButton';
import { useAuth } from '@/context/AuthContext';
import { useContentServices } from '@/hooks/api/useContentServices';
import type { ContentServiceKey } from '@/lib/content-services';
import { colors, spacing, typography } from '@/theme/tokens';

type NavItem = {
  href: string;
  label: string;
  service?: ContentServiceKey;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/(main)', label: 'Home' },
  { href: '/(main)/videos', label: 'Videos', service: 'videos' },
  { href: '/(main)/movies', label: 'Movies', service: 'movies' },
  { href: '/(main)/shorts', label: 'Shorts', service: 'shorts' },
  { href: '/(main)/live', label: 'Live' },
  { href: '/(main)/verticals', label: 'Verticals', service: 'verticals' },
  { href: '/(main)/podcasts', label: 'Podcasts', service: 'podcasts' },
  { href: '/(main)/search', label: 'Search' },
  { href: '/(main)/history', label: 'History' },
];

export function TvShell() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { isEnabled, hasRemoteConfig } = useContentServices();

  const visibleNavItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (!item.service) return true;
        if (!hasRemoteConfig) return true;
        return isEnabled(item.service);
      }),
    [hasRemoteConfig, isEnabled],
  );

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
        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navContent}
          showsVerticalScrollIndicator={false}
        >
          {visibleNavItems.map((item, index) => (
            <TvFocusButton
              key={item.href}
              label={item.label}
              selected={isActive(item.href)}
              hasTVPreferredFocus={index === 0}
              onPress={() => router.push(item.href as Href)}
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
        </ScrollView>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
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
