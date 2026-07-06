import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radius, shadows, typography } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'default' | 'sm' | 'lg';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const sizeStyles: Record<Size, ViewStyle> = {
  default: { paddingHorizontal: 20, paddingVertical: 12 },
  sm: { paddingHorizontal: 16, paddingVertical: 8 },
  lg: { paddingHorizontal: 32, paddingVertical: 14 },
};

export function Button({
  label,
  variant = 'primary',
  size = 'default',
  style,
  textStyle,
  ...rest
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        styles[variant],
        variant === 'primary' && shadows.primaryButton,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.text, styles[`${variant}Text` as const], textStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.88 },
  text: { ...typography.button },
  primaryText: { color: colors.primaryForeground },
  secondaryText: { color: colors.secondaryForeground },
  outlineText: { color: colors.foreground },
  ghostText: { color: colors.primary },
});
