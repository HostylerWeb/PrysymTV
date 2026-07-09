import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { BuyerDetailsForm } from '@/components/forms/BuyerDetailsForm';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useStoreCart } from '@/context/StoreCartContext';
import { useMockAuth } from '@/context/MockAuthContext';
import { useCreatorStore } from '@/hooks/api/useCreatorStore';
import { createStoreCartCheckout } from '@/lib/api/stores';
import { completeMobileCheckout } from '@/lib/stripe-checkout';
import { normalizeUsernameSlug } from '@/lib/username-slug';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';
import {
  buyerDetailsFromUser,
  EMPTY_BUYER_DETAILS,
  isBuyerDetailsComplete,
  shippingAddressFromBuyer,
} from '@/types/buyer-details';

export default function StoreCartScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { requireAuth, user, isAuthenticated } = useMockAuth();
  const cart = useStoreCart();
  const slug = normalizeUsernameSlug(username ?? cart.creatorUsername ?? '');

  const storeQuery = useCreatorStore(slug, Boolean(slug));
  const [buyerDetails, setBuyerDetails] = useState(EMPTY_BUYER_DETAILS);
  const [saveBuyerDetails, setSaveBuyerDetails] = useState(true);
  const [busy, setBusy] = useState(false);
  const [purchaseDone, setPurchaseDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPhysical = cart.lines.some((l) => l.productType === 'merchandise');
  const shippingFee =
    hasPhysical && storeQuery.data && !storeQuery.data.store.shippingFree
      ? storeQuery.data.store.shippingFeeUsd
      : 0;
  const total = cart.subtotalUsd + shippingFee;

  useEffect(() => {
    if (isAuthenticated && user) {
      setBuyerDetails(buyerDetailsFromUser(user));
    }
  }, [isAuthenticated, user]);

  const checkout = async () => {
    if (!requireAuth()) return;
    if (!cart.lines.length) {
      Alert.alert('Cart is empty', 'Add products from the creator store first.');
      return;
    }
    if (hasPhysical && !isBuyerDetailsComplete(buyerDetails)) {
      Alert.alert('Shipping required', 'Complete your shipping address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createStoreCartCheckout(
        cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        hasPhysical
          ? { shippingAddress: shippingAddressFromBuyer(buyerDetails), saveBuyerDetails }
          : undefined,
      );
      const result = await completeMobileCheckout(res);
      if (result.ok) {
        cart.clearCart();
        setPurchaseDone(true);
      } else {
        setError(result.error ?? 'Checkout failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setBusy(false);
    }
  };

  if (purchaseDone) {
    return (
      <View style={[styles.screen, styles.empty]}>
        <View style={styles.pad}>
          <AppHeader showBack title="Cart" showNotifications={false} />
        </View>
        <Ionicons name="bag-check-outline" size={48} color={colors.primary} />
        <ThemedText variant="h2">Order placed</ThemedText>
        <ThemedText variant="bodyMedium" muted style={{ textAlign: 'center' }}>
          Thank you for your purchase from @{slug}.
        </ThemedText>
        <Button label="Back to store" onPress={() => router.push(`/creator/${slug}`)} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Cart" showNotifications={false} />
      </View>

      {cart.lines.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bag-outline" size={48} color={colors.mutedForeground} />
          <ThemedText variant="h3">Your cart is empty</ThemedText>
          <ThemedText variant="bodyMedium" muted>
            Browse products from @{slug}
          </ThemedText>
          <Button label="Browse store" onPress={() => router.push(`/creator/${slug}`)} />
        </View>
      ) : (
        <View style={styles.body}>
          <ThemedText variant="caption" muted>
            Shopping at @{slug} · {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
          </ThemedText>

          {cart.lines.map((line) => (
            <View key={line.productId} style={styles.line}>
              <Image source={{ uri: line.imageUrl ?? '' }} style={styles.thumb} contentFit="cover" />
              <View style={styles.lineInfo}>
                <ThemedText variant="bodyMedium" numberOfLines={2}>
                  {line.title}
                </ThemedText>
                <ThemedText variant="caption" primary>
                  ${line.priceUsd.toFixed(2)}
                </ThemedText>
                <View style={styles.qtyRow}>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => cart.updateQuantity(line.productId, line.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={colors.foreground} />
                  </Pressable>
                  <ThemedText variant="bodyMedium">{line.quantity}</ThemedText>
                  <Pressable
                    style={styles.qtyBtn}
                    onPress={() => cart.updateQuantity(line.productId, line.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
              <Pressable onPress={() => cart.removeItem(line.productId)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}

          {hasPhysical && (
            <View style={styles.shippingBlock}>
              <ThemedText variant="h3">Shipping address</ThemedText>
              <BuyerDetailsForm value={buyerDetails} onChange={setBuyerDetails} />
              <View style={styles.saveRow}>
                <ThemedText variant="bodyMedium">Save for next checkout</ThemedText>
                <Switch value={saveBuyerDetails} onValueChange={setSaveBuyerDetails} />
              </View>
            </View>
          )}

          <View style={styles.summary}>
            <Row label="Subtotal" value={`$${cart.subtotalUsd.toFixed(2)}`} />
            {hasPhysical && (
              <Row label="Shipping" value={shippingFee ? `$${shippingFee.toFixed(2)}` : 'Free'} />
            )}
            <Row label="Total" value={`$${total.toFixed(2)}`} bold primary />
          </View>

          {error ? (
            <ThemedText variant="bodyMedium" style={{ color: colors.destructive }}>
              {error}
            </ThemedText>
          ) : null}

          <Button label={busy ? 'Processing…' : 'Checkout'} onPress={() => void checkout()} disabled={busy} />
          <Button label="Continue shopping" variant="outline" onPress={() => router.push(`/creator/${slug}`)} />
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value, bold, primary }: { label: string; value: string; bold?: boolean; primary?: boolean }) {
  return (
    <View style={styles.row}>
      <ThemedText variant={bold ? 'h3' : 'bodyMedium'} muted={!bold && !primary} primary={primary}>
        {label}
      </ThemedText>
      <ThemedText variant={bold ? 'h3' : 'bodyMedium'} primary={primary}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: spacing.page },
  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  body: { paddingHorizontal: spacing.page, gap: spacing.lg },
  line: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.8),
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.muted },
  lineInfo: { flex: 1, gap: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shippingBlock: { gap: spacing.md },
  saveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summary: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: withAlpha(colors.card, 0.5),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
