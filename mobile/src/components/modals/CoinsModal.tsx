import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { createCoinCheckout, fetchBillingProducts, type CoinPackage } from '@/lib/api/billing';
import { runBillingCheckout } from '@/lib/billing-checkout';
import { useThemedStyles } from '@/theme/useThemedStyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  balance: number;
};

export function CoinsModal({ visible, onClose, balance }: Props) {
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
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
      packCoins: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
      packPrice: { color: colors.primary, fontSize: 16, fontWeight: '600' },
      error: { color: colors.destructive, marginBottom: 8, fontSize: 13 },
    }),
  );
  const { requireAuth, refreshUser } = useMockAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    void fetchBillingProducts()
      .then(setPackages)
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const buy = (pkg: CoinPackage) => {
    requireAuth(async () => {
      setBusyId(pkg.id);
      setError(null);
      try {
        const res = await createCoinCheckout(pkg.id);
        const result = await runBillingCheckout(res, () => refreshUser());
        if (result.ok) onClose();
        else setError(result.error ?? 'Checkout failed');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Checkout failed');
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Coins">
      <Text style={styles.balance}>Balance: 🪙 {balance.toLocaleString()}</Text>
      <Text style={styles.sub}>Send gifts during live streams. Purchases are processed securely at checkout.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} />
      ) : (
        packages.map((p) => (
          <View key={p.id} style={styles.pack}>
            <Text style={styles.packCoins}>🪙 {p.coins.toLocaleString()}</Text>
            <Text style={styles.packPrice}>
              ${typeof p.priceUsd === 'number' ? p.priceUsd.toFixed(2) : p.priceUsd}
            </Text>
            <Button
              label={busyId === p.id ? 'Processing…' : 'Buy'}
              variant="outline"
              disabled={busyId != null}
              onPress={() => buy(p)}
            />
          </View>
        ))
      )}
    </BottomSheet>
  );
}
