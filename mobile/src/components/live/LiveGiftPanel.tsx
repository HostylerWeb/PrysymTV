import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMockAuth } from '@/context/MockAuthContext';
import { fetchGiftsCatalog, sendGift, type GiftCatalogItem } from '@/lib/api/billing';
import { colors, radius } from '@/theme/tokens';

const GIFT_EMOJI: Record<string, string> = {
  rose: '🌹',
  fire: '🔥',
  rocket: '🚀',
  heart: '❤️',
  star: '⭐',
};

type Props = {
  receiverId: string;
  streamId?: string;
  onSent?: () => void;
};

export function LiveGiftPanel({ receiverId, streamId, onSent }: Props) {
  const { user, requireAuth, refreshUser } = useMockAuth();
  const [catalog, setCatalog] = useState<GiftCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchGiftsCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoading(false));
  }, []);

  const send = () => {
    if (!requireAuth(() => {})) return;
    const gift = catalog.find((g) => g.id === selected);
    if (!gift) return;
    void (async () => {
      setError(null);
      try {
        await sendGift({ giftId: gift.id, receiverId, streamId });
        await refreshUser();
        setSent(true);
        onSent?.();
        setTimeout(() => setSent(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not send gift');
      }
    })();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Send a gift</Text>
      <Text style={styles.balance}>Balance: {user?.coinsBalance?.toLocaleString() ?? '0'} coins</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.grid}>
          {catalog.map((g) => (
            <Pressable
              key={g.id}
              style={[styles.gift, selected === g.id && styles.giftOn]}
              onPress={() => requireAuth(() => setSelected(g.id))}
            >
              <Text style={styles.emoji}>{GIFT_EMOJI[g.animationKey] ?? '🎁'}</Text>
              <Text style={styles.name}>{g.name}</Text>
              <Text style={styles.coins}>{g.coinCost} coins</Text>
            </Pressable>
          ))}
        </View>
      )}
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
  error: { color: colors.destructive, fontSize: 12, marginBottom: 8 },
  grid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  gift: {
    width: '30%',
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
