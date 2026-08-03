import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { USER_GENDER_OPTIONS, type UserGenderValue } from '@/lib/user-gender';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Props = {
  value: UserGenderValue | '';
  onChange: (value: UserGenderValue) => void;
  label?: string;
};

export function GenderField({ value, onChange, label = 'Gender' }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel =
    USER_GENDER_OPTIONS.find((option) => option.value === value)?.label ??
    'Select gender';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          color: colors.foreground,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 8,
        },
        trigger: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.input,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: 14,
        },
        triggerText: {
          color: value ? colors.foreground : colors.mutedForeground,
          fontSize: 15,
          flex: 1,
        },
        backdrop: {
          flex: 1,
          backgroundColor: colors.scrim,
          justifyContent: 'center',
          padding: spacing.page,
        },
        sheet: {
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
        },
        sheetTitle: {
          color: colors.foreground,
          fontWeight: '700',
          fontSize: 16,
          marginBottom: spacing.sm,
          paddingHorizontal: spacing.sm,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.md,
        },
        optionOn: { backgroundColor: colors.secondary },
        optionText: { color: colors.foreground, fontSize: 15 },
        optionTextOn: { color: colors.primary, fontWeight: '600' },
      }),
    [colors, value],
  );

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {USER_GENDER_OPTIONS.map((option) => {
                const selected = value === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, selected && styles.optionOn]}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextOn]}>
                      {option.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
