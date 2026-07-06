import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/theme/tokens';

const GIFTS = [
  { id: 'g1', name: 'Rose', coins: 10 },
  { id: 'g2', name: 'Fire', coins: 50 },
  { id: 'g3', name: 'Rocket', coins: 200 },
];

type Props = { visible: boolean; onClose: () => void };

export function GiftModal({ visible, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Send a gift">
      <Text style={styles.sub}>Support the creator with coins during live streams.</Text>
      <View style={styles.grid}>
        {GIFTS.map((g) => (
          <Pressable
            key={g.id}
            style={[styles.gift, selected === g.id && styles.giftOn]}
            onPress={() => setSelected(g.id)}
          >
            <Text style={styles.emoji}>🎁</Text>
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.coins}>🪙 {g.coins}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Send gift" disabled={!selected} onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.mutedForeground, marginBottom: 16 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  gift: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  giftOn: { borderColor: colors.primary },
  emoji: { fontSize: 28 },
  name: { color: colors.foreground, fontWeight: '600', marginTop: 6 },
  coins: { color: colors.primary, fontSize: 12, marginTop: 2 },
});
