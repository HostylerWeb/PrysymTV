import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  muted?: boolean;
  primary?: boolean;
  style?: TextStyle;
};

export function ThemedText({
  variant = 'body',
  muted,
  primary,
  style,
  children,
  ...rest
}: Props) {
  const color = primary
    ? colors.primary
    : muted
      ? colors.mutedForeground
      : colors.foreground;

  return (
    <Text style={[typography[variant], { color }, style]} {...rest}>
      {children}
    </Text>
  );
}
