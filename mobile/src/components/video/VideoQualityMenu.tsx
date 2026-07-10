import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HlsVariant } from '@/lib/hls-variants';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Props = {
  variants: HlsVariant[];
  selectedUri: string | null;
  onSelect: (variant: HlsVariant | null) => void;
};

export function VideoQualityMenu({ variants, selectedUri, onSelect }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  if (variants.length <= 1) return null;

  const activeLabel =
    variants.find((v) => v.uri === selectedUri)?.label ?? 'Auto';

  return (
    <>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.secondary + 'CC' }]}
        onPress={() => setOpen(true)}
        hitSlop={8}
      >
        <Ionicons name="settings-outline" size={16} color={colors.onVideo} />
        <Text style={[styles.btnText, { color: colors.onVideo }]}>{activeLabel}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.title, { color: colors.foreground }]}>Quality</Text>
            <Pressable
              style={[styles.row, !selectedUri && { backgroundColor: colors.primary + '18' }]}
              onPress={() => {
                onSelect(null);
                setOpen(false);
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: !selectedUri ? '700' : '500' }}>Auto</Text>
            </Pressable>
            {variants.map((variant) => {
              const on = selectedUri === variant.uri;
              return (
                <Pressable
                  key={variant.uri}
                  style={[styles.row, on && { backgroundColor: colors.primary + '18' }]}
                  onPress={() => {
                    onSelect(variant);
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: on ? '700' : '500' }}>
                    {variant.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  btnText: { fontSize: 11, fontWeight: '600' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 16,
    paddingBottom: 28,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
  },
});
