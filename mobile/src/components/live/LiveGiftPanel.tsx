import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius } from '@/theme/tokens';

const GIFTS = [
  { id: 'g1', name: 'Rose', coins: 10, emoji: '🌹' },
  { id: 'g2', name: 'Fire', coins: 50, emoji: '🔥' },
  { id: 'g3', name: 'Rocket', coins: 200, emoji: '🚀' },
];

type Props = {
  onSent?: () => void;
};

export function LiveGiftPanel({ onSent }: Props) {
  const { user, requireAuth } = useMockAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!requireAuth(() => {})) return;
    if (!selected) return;
    setSent(true);
    onSent?.();
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Send a gift</Text>
      <Text style={styles.balance}>Balance: {user?.coinsBalance?.toLocaleString() ?? '0'} coins</Text>
      <View style={styles.grid}>
        {GIFTS.map((g) => (
          <Pressable
            key={g.id}
            style={[styles.gift, selected === g.id && styles.giftOn]}
            onPress={() => requireAuth(() => setSelected(g.id))}
          >
            <Text style={styles.emoji}>{g.emoji}</Text>
            <Text style={styles.name}>{g.name}</Text>
            <Text style={styles.coins}>{g.coins} coins</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={[styles.sendBtn, (!selected || sent) && styles.sendOff]} onPress={send} disabled={!selected || sent}>
        <Text style={styles.sendText}>{sent ? 'Sent!' : 'Send gift'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.foreground, fontWeight: '700', fontSize: 14 },
  balance: { color: colors.mutedForeground, fontSize: 12, marginTop: 2, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 8 },
  gift: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  giftOn: { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
  emoji: { fontSize: 24 },
  name: { color: colors.foreground, fontWeight: '600', fontSize: 12, marginTop: 4 },
  coins: { color: colors.primary, fontSize: 10, marginTop: 2 },
  sendBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sendOff: { opacity: 0.45 },
  sendText: { color: colors.primaryForeground, fontWeight: '700' },
});
