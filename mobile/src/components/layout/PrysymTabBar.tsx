import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useContentServices } from '@/hooks/api/useContentServices';
import type { ContentServiceKey } from '@/lib/content-services';
import { radius, shadows, spacing, typography, withAlpha } from '@/theme/tokens';

const TAB_CONTENT_SERVICES: Partial<Record<string, ContentServiceKey>> = {
  videos: 'videos',
  movies: 'movies',
  shorts: 'shorts',
  verticals: 'verticals',
  podcasts: 'podcasts',
};

export function PrysymTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isEnabled, hasRemoteConfig } = useContentServices();

  function isTabVisible(routeName: string): boolean {
    if (routeName === 'home') return false;
    const service = TAB_CONTENT_SERVICES[routeName];
    if (!service) return true;
    if (!hasRemoteConfig) return true;
    return isEnabled(service);
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: withAlpha(colors.background, 0.98),
          borderTopColor: colors.border,
        },
        shadows.tabBar,
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route) => {
          if (!isTabVisible(route.name)) return null;

          const { options } = descriptors[route.key];

          const isFocused = state.routes[state.index]?.key === route.key;
          const label = options.title ?? route.name;
          const color = isFocused ? colors.primary : colors.mutedForeground;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[styles.item, isFocused && { backgroundColor: withAlpha(colors.primary, 0.1) }]}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color,
                size: isFocused ? 26 : 24,
              })}
              <Text style={[styles.label, { color }, isFocused && styles.labelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    minHeight: spacing.tabBar - 16,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  label: {
    ...typography.micro,
  },
  labelActive: {
    fontWeight: '700',
  },
});
