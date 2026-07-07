import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Props = TextInputProps & {
  label?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
};

export function ThemedInput({ label, containerStyle, inputStyle, style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
        input: {
          backgroundColor: colors.input,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: colors.foreground,
          fontSize: 15,
        },
        multiline: { minHeight: 80, textAlignVertical: 'top' as const },
      }),
    [colors],
  );

  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, rest.multiline && styles.multiline, inputStyle, style]}
        {...rest}
      />
    </>
  );
}
