import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme/tokens';

const FOOTER_LINKS = [
  { label: 'Community Impact', route: '/impact' },
  { label: 'Advertise', route: '/advertise' },
  { label: 'Terms of Service', route: '/terms' },
  { label: 'Privacy Policy', route: '/privacy' },
  { label: 'Cookie Policy', route: '/cookies' },
  { label: 'Community Guidelines', route: '/guidelines' },
] as const;

const FOOTER_ROUTES = new Set(FOOTER_LINKS.map((link) => link.route));

export function PageFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const onFooterPage = FOOTER_ROUTES.has(pathname);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const inTabs = segments[0] === '(tabs)';
  const bottomPadding = inTabs ? spacing.tabBar + Math.max(insets.bottom, 8) : spacing.lg;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
        © {new Date().getFullYear()} Prysym TV. All rights reserved.
      </Text>

      <View style={styles.links}>
        {FOOTER_LINKS.map((link) => (
          <Pressable
            key={link.route}
            accessibilityRole="link"
            style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (link.route === pathname) return;
              if (onFooterPage) router.replace(link.route as never);
              else router.push(link.route as never);
            }}
          >
            <Text style={[styles.link, { color: colors.mutedForeground }]}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xl * 2,
    marginHorizontal: -spacing.page,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl * 2,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: spacing.lg,
  },
  copyright: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  linkBtn: {
    paddingVertical: 2,
  },
  link: {
    ...typography.bodyMedium,
    textAlign: 'center',
  },
});
