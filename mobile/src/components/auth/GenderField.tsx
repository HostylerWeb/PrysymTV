import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { USER_GENDER_OPTIONS, type UserGenderValue } from '@/lib/user-gender';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Props = {
  value: UserGenderValue | '';
  onChange: (value: UserGenderValue) => void;
  label?: string;
};

export function GenderField({ value, onChange, label = 'Gender' }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      {USER_GENDER_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary + '10' : colors.card,
              },
            ]}
            onPress={() => onChange(option.value)}
          >
            <View
              style={[
                styles.radio,
                {
                  borderColor: selected ? colors.primary : colors.mutedForeground,
                },
              ]}
            >
              {selected ? (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              ) : null}
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14, flex: 1 }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
});
