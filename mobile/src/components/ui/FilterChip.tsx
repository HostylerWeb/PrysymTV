import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, radius, withAlpha } from '@/theme/tokens';

type Variant = 'primary' | 'soft' | 'neutral' | 'inverted';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  variant?: Variant;
  style?: ViewStyle;
};

export function FilterChip({ label, active, onPress, variant = 'neutral', style }: Props) {
  const chipStyle = [
    styles.chip,
    variant === 'inverted' && (active ? styles.invertedOn : styles.invertedOff),
    variant === 'primary' && (active ? styles.primaryOn : styles.neutralOff),
    variant === 'soft' && (active ? styles.softOn : styles.neutralOff),
    variant === 'neutral' && (active ? styles.primaryOn : styles.neutralOff),
    style,
  ];

  const textInverted = variant === 'inverted';

  return (
    <Pressable onPress={onPress} style={chipStyle}>
      <Text
        style={[
          styles.label,
          textInverted
            ? active
              ? styles.invertedTextOn
              : styles.invertedTextOff
            : active && (variant === 'primary' || variant === 'neutral')
              ? styles.primaryTextOn
              : active && variant === 'soft'
                ? styles.softTextOn
                : styles.labelMuted,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  labelMuted: { color: colors.mutedForeground },
  primaryOn: { backgroundColor: colors.primary },
  primaryTextOn: { color: colors.primaryForeground, fontWeight: '600' },
  softOn: { backgroundColor: withAlpha(colors.primary, 0.15) },
  neutralOff: {
    backgroundColor: withAlpha(colors.secondary, 0.6),
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.5),
  },
  invertedOn: { backgroundColor: colors.foreground },
  invertedOff: { backgroundColor: colors.secondary },
  softTextOn: { color: colors.primary },
  invertedTextOn: { color: colors.background },
  invertedTextOff: { color: colors.foreground },
});
