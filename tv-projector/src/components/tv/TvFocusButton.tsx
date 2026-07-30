import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Props = PressableProps & {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TvFocusButton({
  label,
  selected = false,
  style,
  ...props
}: Props) {
  return (
    <Pressable
      focusable
      {...props}
      style={({ focused }) => [
        styles.base,
        selected && styles.selected,
        focused && styles.focused,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.secondary,
    minWidth: 140,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  focused: {
    borderColor: colors.focus,
    transform: [{ scale: 1.04 }],
  },
  label: {
    color: colors.foreground,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedLabel: {
    color: colors.foreground,
    fontWeight: '700',
  },
});
