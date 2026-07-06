import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { BuyerDetailsForm } from '@/components/forms/BuyerDetailsForm';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useStoreCart } from '@/context/StoreCartContext';
import { useMockAuth } from '@/context/MockAuthContext';
import { getMockStoreProduct } from '@/mocks';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';
import { StoreCartLink } from '@/components/store/StoreCartLink';
import { EMPTY_BUYER_DETAILS, isBuyerDetailsComplete } from '@/types/buyer-details';

export default function StoreProductScreen() {
  const { username, productId } = useLocalSearchParams<{ username: string; productId: string }>();
  const router = useRouter();
  const product = getMockStoreProduct(productId ?? '') ?? getMockStoreProduct('sp-1')!;
  const slug = username ?? product.creatorUsername ?? 'creator';
  const { user, isAuthenticated, requireAuth } = useMockAuth();
  const cart = useStoreCart();
  const isOwner = isAuthenticated && user?.username?.toLowerCase() === slug.toLowerCase();

  const images = useMemo(
    () => [product.imageUrl, ...(product.galleryUrls ?? [])].filter(Boolean) as string[],
    [product],
  );
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buyerDetails, setBuyerDetails] = useState(EMPTY_BUYER_DETAILS);
  const [saveBuyerDetails, setSaveBuyerDetails] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const isPhysical = product.productType !== 'digital';
  const price = parseFloat(product.priceUsd);
  const shippingFee = isPhysical && !product.shippingFree ? (product.shippingFeeUsd ?? 0) : 0;

  const addToCart = () => {
    if (!requireAuth()) return;
    cart.addItem(slug, {
      productId: product.id,
      title: product.title,
      priceUsd: price,
      imageUrl: product.imageUrl,
      productType: product.productType ?? 'merchandise',
      quantity,
    });
    setMessage('Added to cart');
  };

  const buyNow = () => {
    if (!requireAuth()) return;
    if (isPhysical && !isBuyerDetailsComplete(buyerDetails)) {
      Alert.alert('Shipping required', 'Complete your shipping address for physical products.');
      return;
    }
    addToCart();
    router.push(`/creator/${slug}/store/cart`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <View style={styles.headerRow}>
          <AppHeader showBack title="Store" showNotifications={false} />
          {!isOwner && <StoreCartLink creatorUsername={slug} />}
        </View>
      </View>

      <View style={styles.gallery}>
        <Image source={{ uri: images[activeImage] }} style={styles.heroImg} contentFit="cover" />
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {images.map((url, i) => (
              <Pressable key={`${url}-${i}`} onPress={() => setActiveImage(i)}>
                <Image
                  source={{ uri: url }}
                  style={[styles.thumb, activeImage === i && styles.thumbActive]}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.badges}>
          <View style={[styles.badge, product.productType === 'digital' ? styles.badgeDigital : styles.badgePhysical]}>
            <ThemedText variant="micro" style={styles.badgeText}>
              {product.productType === 'digital' ? 'Digital' : 'Physical'}
            </ThemedText>
          </View>
          {!product.inStock && (
            <View style={[styles.badge, styles.badgeOut]}>
              <ThemedText variant="micro" style={styles.badgeText}>Out of stock</ThemedText>
            </View>
          )}
        </View>

        <ThemedText variant="h1">{product.title}</ThemedText>
        <ThemedText variant="hero" primary style={styles.price}>
          ${product.priceUsd}
        </ThemedText>
        {product.description ? (
          <ThemedText variant="bodyMedium" muted style={styles.desc}>
            {product.description}
          </ThemedText>
        ) : null}

        {isPhysical && (
          <View style={styles.shippingCard}>
            <Ionicons name="cube-outline" size={18} color={colors.primary} />
            <ThemedText variant="bodyMedium">
              {product.shippingFree
                ? 'Free shipping on this item'
                : `Flat shipping $${shippingFee.toFixed(2)} per order`}
            </ThemedText>
          </View>
        )}

        <View style={styles.qtyRow}>
          <ThemedText variant="bodyMedium">Quantity</ThemedText>
          <View style={styles.qtyControls}>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
              <Ionicons name="remove" size={18} color={colors.foreground} />
            </Pressable>
            <ThemedText variant="h3">{quantity}</ThemedText>
            <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(99, q + 1))}>
              <Ionicons name="add" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {isPhysical && (
          <View style={styles.shippingForm}>
            <ThemedText variant="h3" style={styles.sectionTitle}>
              Shipping details
            </ThemedText>
            <BuyerDetailsForm value={buyerDetails} onChange={setBuyerDetails} />
            <View style={styles.saveRow}>
              <ThemedText variant="bodyMedium">Save for next checkout</ThemedText>
              <Switch value={saveBuyerDetails} onValueChange={setSaveBuyerDetails} />
            </View>
          </View>
        )}

        {message ? (
          <ThemedText variant="bodyMedium" primary>
            {message}
          </ThemedText>
        ) : null}

        <View style={styles.actions}>
          {isOwner ? (
            <Button
              label="Edit listing"
              variant="outline"
              onPress={() => router.push('/profile')}
              style={styles.flex}
            />
          ) : (
            <>
              <Button
                label="Add to cart"
                variant="outline"
                onPress={addToCart}
                disabled={!product.inStock}
                style={styles.flex}
              />
              <Button
                label="Buy now"
                onPress={buyNow}
                disabled={!product.inStock}
                style={styles.flex}
              />
            </>
          )}
        </View>

        <Button
          label={`View cart (${cart.itemCount})`}
          variant="ghost"
          onPress={() => router.push(`/creator/${slug}/store/cart`)}
        />
        <Button
          label="Back to creator store"
          variant="ghost"
          onPress={() => router.push(`/creator/${slug}`)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: spacing.page },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gallery: { marginBottom: spacing.lg },
  heroImg: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.muted,
  },
  thumbs: { gap: spacing.sm, paddingHorizontal: spacing.page, paddingTop: spacing.sm },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.secondary,
  },
  thumbActive: { borderColor: colors.primary },
  body: { paddingHorizontal: spacing.page, gap: spacing.md },
  badges: { flexDirection: 'row', gap: spacing.sm },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgePhysical: { backgroundColor: withAlpha('#3B82F6', 0.15) },
  badgeDigital: { backgroundColor: withAlpha('#8B5CF6', 0.15) },
  badgeOut: { backgroundColor: withAlpha(colors.destructive, 0.12) },
  badgeText: { color: colors.foreground },
  price: { fontSize: 28 },
  desc: { lineHeight: 22 },
  shippingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: withAlpha(colors.primary, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.2),
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shippingForm: { gap: spacing.md },
  sectionTitle: { marginBottom: 4 },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
});
