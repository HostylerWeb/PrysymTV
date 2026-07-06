import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/tokens';

const PACKAGES = [
  { coins: 500, price: '$4.99' },
  { coins: 1200, price: '$9.99', popular: true },
  { coins: 3000, price: '$19.99' },
];

type Props = { visible: boolean; onClose: () => void; balance: number };

export function CoinsModal({ visible, onClose, balance }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Coins">
      <Text style={styles.balance}>Balance: 🪙 {balance.toLocaleString()}</Text>
      <Text style={styles.sub}>Send gifts during live streams. Mock checkout - Stripe in Phase C.</Text>
      {PACKAGES.map((p) => (
        <View key={p.coins} style={[styles.pack, p.popular && styles.popular]}>
          <Text style={styles.packCoins}>🪙 {p.coins.toLocaleString()}</Text>
          <Text style={styles.packPrice}>{p.price}</Text>
          <Button label="Buy" variant={p.popular ? 'primary' : 'outline'} onPress={onClose} />
        </View>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  balance: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  sub: { color: colors.mutedForeground, fontSize: 13, marginBottom: 20 },
  pack: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 8,
  },
  popular: { borderColor: colors.primary },
  packCoins: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  packPrice: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
