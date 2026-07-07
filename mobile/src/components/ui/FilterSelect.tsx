import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function FilterSelect({ label, value, options, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        trigger: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colors.input,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          minWidth: 108,
          maxWidth: 150,
        },
        triggerText: { color: colors.foreground, fontSize: 13, fontWeight: '600', flex: 1 },
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
    [colors],
  );

  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.option, opt === value && styles.optionOn]}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, opt === value && styles.optionTextOn]}>{opt}</Text>
                  {opt === value ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
