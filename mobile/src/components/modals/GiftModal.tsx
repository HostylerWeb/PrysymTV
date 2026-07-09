import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { fetchGiftsCatalog, sendGift, type GiftCatalogItem } from '@/lib/api/billing';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ThemeColors } from '@/theme/tokens';
import { radius } from '@/theme/tokens';

const GIFT_EMOJI: Record<string, string> = {
  rose: '🌹',
  fire: '🔥',
  rocket: '🚀',
  heart: '❤️',
  star: '⭐',
};

function giftEmoji(animationKey: string) {
  return GIFT_EMOJI[animationKey] ?? '🎁';
}

type Props = {
  visible: boolean;
  onClose: () => void;
  receiverId?: string;
  receiverName?: string;
  streamId?: string;
  videoId?: string;
};

export function GiftModal({
  visible,
  onClose,
  receiverId,
  receiverName,
  streamId,
  videoId,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const { user, requireAuth, refreshUser } = useMockAuth();
  const [catalog, setCatalog] = useState<GiftCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    void fetchGiftsCatalog()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const send = () => {
    if (!selected || !receiverId) {
      setError(receiverId ? 'Select a gift.' : 'Creator not available for gifts.');
      return;
    }
    const gift = catalog.find((g) => g.id === selected);
    if (!gift) return;
    if ((user?.coinsBalance ?? 0) < gift.coinCost) {
      setError('Not enough coins. Buy more from your profile.');
      return;
    }
    requireAuth(async () => {
      setBusyId(selected);
      setError(null);
      try {
        await sendGift({ giftId: gift.id, receiverId, streamId, videoId });
        await refreshUser();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not send gift');
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Send a gift">
      <Text style={styles.sub}>
        {receiverName ? `Support ${receiverName} with coins.` : 'Support the creator with coins.'}
      </Text>
      <Text style={styles.balance}>Your balance: 🪙 {user?.coinsBalance?.toLocaleString() ?? '0'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} />
      ) : (
        <View style={styles.grid}>
          {catalog.map((g) => (
            <Pressable
              key={g.id}
              style={[styles.gift, selected === g.id && styles.giftOn]}
              onPress={() => setSelected(g.id)}
            >
              <Text style={styles.emoji}>{giftEmoji(g.animationKey)}</Text>
              <Text style={styles.name}>{g.name}</Text>
              <Text style={styles.coins}>🪙 {g.coinCost}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Button label={busyId ? 'Sending…' : 'Send gift'} disabled={!selected || busyId != null} onPress={send} />
    </BottomSheet>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sub: { color: colors.mutedForeground, marginBottom: 8 },
    balance: { color: colors.foreground, fontWeight: '600', marginBottom: 12 },
    error: { color: colors.destructive, marginBottom: 8, fontSize: 13 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    gift: {
      width: '30%',
      alignItems: 'center',
      padding: 12,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    giftOn: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
    emoji: { fontSize: 28 },
    name: { color: colors.foreground, fontWeight: '600', marginTop: 6, fontSize: 12 },
    coins: { color: colors.primary, fontSize: 12, marginTop: 2 },
  });
}
