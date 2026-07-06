import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

type Variant = 'default' | 'soft' | 'gradient';

type Props = ViewProps & {
  variant?: Variant;
  padded?: boolean;
};

export function Card({ style, children, variant = 'default', padded = true, ...rest }: Props) {
  return (
    <View
      style={[
        styles.base,
        variant === 'soft' && styles.soft,
        variant === 'gradient' && styles.gradient,
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
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.6),
  },
  soft: {
    backgroundColor: withAlpha(colors.card, 0.4),
    borderColor: withAlpha(colors.border, 0.8),
    borderRadius: radius.lg,
  },
  gradient: {
    backgroundColor: withAlpha(colors.card, 0.8),
    borderColor: withAlpha(colors.border, 0.8),
  },
  padded: {
    padding: spacing.lg,
  },
});
