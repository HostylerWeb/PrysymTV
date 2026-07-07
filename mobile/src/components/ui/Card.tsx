import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, withAlpha } from '@/theme/tokens';

type Variant = 'default' | 'soft' | 'gradient';

type Props = ViewProps & {
  variant?: Variant;
  padded?: boolean;
};

export function Card({ style, children, variant = 'default', padded = true, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: withAlpha(colors.border, 0.6),
        },
        variant === 'soft' && {
          backgroundColor: withAlpha(colors.card, 0.4),
          borderColor: withAlpha(colors.border, 0.8),
        },
        variant === 'gradient' && {
          backgroundColor: withAlpha(colors.primary, 0.08),
          borderColor: withAlpha(colors.primary, 0.25),
        },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  padded: {
    padding: spacing.lg,
  },
});
