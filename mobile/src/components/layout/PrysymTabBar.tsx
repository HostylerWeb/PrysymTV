import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, typography, withAlpha } from '@/theme/tokens';

export function PrysymTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }, shadows.tabBar]}>
      <View style={styles.row}>
        {state.routes.map((route) => {
          const { options } = descriptors[route.key];
          if (route.name === 'home') return null;

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
              style={[styles.item, isFocused && styles.itemActive]}
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
    backgroundColor: withAlpha(colors.background, 0.95),
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  itemActive: {
    backgroundColor: withAlpha(colors.primary, 0.1),
  },
  label: {
    ...typography.micro,
  },
  labelActive: {
    color: colors.primary,
  },
});
