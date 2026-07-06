import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/theme/tokens';

const FEATURES = [
  { id: 'live', label: 'Live streaming' },
  { id: 'vertical', label: 'Vertical series' },
  { id: 'store', label: 'Creator store' },
] as const;

type Props = { visible: boolean; onClose: () => void; onSubmit?: () => void };

export function CreatorUnlockModal({ visible, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>(['live']);
  const [description, setDescription] = useState('');

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Unlock creator features">
      <Text style={styles.sub}>Select formats to request. Admin reviews applications on web.</Text>
      {FEATURES.map((f) => {
        const on = selected.includes(f.id);
        return (
          <Pressable
            key={f.id}
            style={[styles.row, on && styles.rowOn]}
            onPress={() =>
              setSelected((s) => (on ? s.filter((x) => x !== f.id) : [...s, f.id]))
            }
          >
            <Text style={styles.rowLabel}>{f.label}</Text>
            <Text style={styles.check}>{on ? '✓' : ''}</Text>
          </Pressable>
        );
      })}
      <TextInput
        style={[styles.input, { marginTop: 12 }]}
        placeholder="Tell us about your content (optional)"
        placeholderTextColor={colors.mutedForeground}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button label="Submit application" onPress={() => { onSubmit?.(); onClose(); }} style={{ marginTop: 16 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  rowLabel: { color: colors.foreground, fontWeight: '600' },
  check: { color: colors.primary, fontWeight: '800' },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 12,
    color: colors.foreground,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
