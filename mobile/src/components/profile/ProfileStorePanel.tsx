import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FeedQueryState } from '@/components/ui/FeedQueryState';
import { ThemedText } from '@/components/ui/ThemedText';
import { useMockAuth } from '@/context/MockAuthContext';
import { useMyStore } from '@/hooks/api/useMyStore';
import {
  createMyStoreProduct,
  deleteMyStoreProduct,
  stockLabel,
  updateMyStore,
  updateMyStoreProduct,
  uploadStoreProductImage,
} from '@/lib/api/stores';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

type ProductForm = {
  title: string;
  priceUsd: string;
  productType: 'merchandise' | 'digital';
  description: string;
  imageUrl: string;
};

const EMPTY_FORM: ProductForm = {
  title: '',
  priceUsd: '',
  productType: 'merchandise',
  description: '',
  imageUrl: '',
};

const inputStyle = {
  padding: spacing.md,
  borderRadius: radius.lg,
  backgroundColor: colors.secondary,
  color: colors.foreground,
  fontSize: 14,
};

export function ProfileStorePanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useMockAuth();
  const storeQuery = useMyStore();

  const [formOpen, setFormOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [settings, setSettings] = useState({
    displayName: '',
    description: '',
    shippingFree: true,
    shippingFeeUsd: '5.99',
  });
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeQuery.data) return;
    setSettings({
      displayName: storeQuery.data.store.displayName,
      description: storeQuery.data.store.description ?? '',
      shippingFree: storeQuery.data.store.shippingFree,
      shippingFeeUsd: storeQuery.data.store.shippingFree
        ? '5.99'
        : String(storeQuery.data.store.shippingFeeUsd ?? 0),
    });
  }, [storeQuery.data]);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['store', 'me'] });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    const p = storeQuery.data?.products.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setForm({
      title: p.title,
      priceUsd: String(p.priceUsd),
      productType: p.productType === 'digital' ? 'digital' : 'merchandise',
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
    });
    setError(null);
    setFormOpen(true);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add a product image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingImage(true);
    setError(null);
    try {
      const imageUrl = await uploadStoreProductImage({
        uri: asset.uri,
        mimeType: asset.mimeType,
        name: asset.fileName ?? 'product.jpg',
      });
      setForm((f) => ({ ...f, imageUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const save = async () => {
    const price = parseFloat(form.priceUsd);
    if (!form.title.trim() || !Number.isFinite(price) || price <= 0) {
      setError('Enter a title and valid price.');
      return;
    }
    if (!form.imageUrl.trim()) {
      setError('Add a product image.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await updateMyStoreProduct(editingId, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priceUsd: price,
          imageUrl: form.imageUrl,
        });
      } else {
        await createMyStoreProduct({
          productType: form.productType,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priceUsd: price,
          imageUrl: form.imageUrl,
          inventoryUnlimited: form.productType === 'digital',
        });
      }
      refresh();
      setFormOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = (id: string, title: string) => {
    Alert.alert('Delete product', `Remove "${title}" from your store?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteMyStoreProduct(id);
              refresh();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete product');
            }
          })();
        },
      },
    ]);
  };

  const saveSettings = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateMyStore({
        displayName: settings.displayName.trim() || undefined,
        description: settings.description.trim() || undefined,
        shippingFree: settings.shippingFree,
        shippingFeeUsd: settings.shippingFree ? 0 : parseFloat(settings.shippingFeeUsd) || 0,
      });
      refresh();
      setSettingsOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save store settings');
    } finally {
      setBusy(false);
    }
  };

  if (storeQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (storeQuery.isError) {
    return (
      <FeedQueryState
        isError
        error={storeQuery.error}
        onRetry={() => void storeQuery.refetch()}
      />
    );
  }

  const products = storeQuery.data?.products ?? [];

  return (
    <>
      <View style={styles.wrap}>
        <ThemedText variant="h3">My store</ThemedText>
        <ThemedText variant="caption" muted style={styles.sub}>
          {storeQuery.data?.store.displayName ?? 'Creator store'}
        </ThemedText>

        <View style={styles.actions}>
          <Button label="Add product" variant="outline" onPress={openCreate} style={styles.flex} />
          <Button label="Store settings" variant="outline" onPress={() => setSettingsOpen(true)} style={styles.flex} />
        </View>
        <Button
          label="Public store"
          variant="ghost"
          onPress={() => router.push(`/creator/${user?.username ?? 'creator'}`)}
        />

        {products.length === 0 ? (
          <ThemedText variant="bodyMedium" muted>
            No products yet. Add your first listing.
          </ThemedText>
        ) : (
          products.map((p) => (
            <View key={p.id} style={styles.product}>
              <Image source={{ uri: p.imageDisplayUrl ?? '' }} style={styles.img} contentFit="cover" />
              <View style={styles.info}>
                <ThemedText variant="bodyMedium">{p.title}</ThemedText>
                <ThemedText variant="caption" primary>
                  ${p.priceUsd.toFixed(2)}
                </ThemedText>
                <ThemedText variant="micro" muted>
                  {p.productType === 'digital' ? 'Digital' : 'Physical'} ·{' '}
                  {stockLabel({
                    productType: p.productType,
                    inventory: p.inventory,
                    inventoryUnlimited: p.inventoryUnlimited,
                    inStock:
                      p.productType === 'digital' ||
                      p.inventoryUnlimited ||
                      (p.inventory ?? 0) > 0,
                  })}
                </ThemedText>
              </View>
              <Pressable onPress={() => openEdit(p.id)}>
                <ThemedText variant="bodyMedium" primary>
                  Edit
                </ThemedText>
              </Pressable>
              <Pressable onPress={() => deleteProduct(p.id, p.title)}>
                <ThemedText variant="bodyMedium" style={{ color: colors.destructive }}>
                  Delete
                </ThemedText>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <BottomSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit product' : 'New product'}
      >
        <View style={styles.form}>
          <View style={styles.typeRow}>
            {(['merchandise', 'digital'] as const).map((t) => (
              <Pressable
                key={t}
                style={[styles.typeBtn, form.productType === t && styles.typeBtnOn]}
                onPress={() => setForm((f) => ({ ...f, productType: t }))}
              >
                <ThemedText variant="bodyMedium" primary={form.productType === t}>
                  {t === 'merchandise' ? 'Physical' : 'Digital'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={inputStyle}
            placeholder="Product title"
            placeholderTextColor={colors.mutedForeground}
            value={form.title}
            onChangeText={(title) => setForm((f) => ({ ...f, title }))}
          />
          <TextInput
            style={inputStyle}
            placeholder="Price USD"
            placeholderTextColor={colors.mutedForeground}
            value={form.priceUsd}
            onChangeText={(priceUsd) => setForm((f) => ({ ...f, priceUsd }))}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[inputStyle, styles.multiline]}
            placeholder="Description"
            placeholderTextColor={colors.mutedForeground}
            value={form.description}
            onChangeText={(description) => setForm((f) => ({ ...f, description }))}
            multiline
          />
          {form.imageUrl ? (
            <Image source={{ uri: form.imageUrl }} style={styles.previewImg} contentFit="cover" />
          ) : null}
          <Button
            label={uploadingImage ? 'Uploading…' : form.imageUrl ? 'Change image' : 'Add product image'}
            variant="outline"
            onPress={() => void pickImage()}
            disabled={uploadingImage}
          />
          {error ? (
            <ThemedText variant="caption" style={{ color: colors.destructive }}>
              {error}
            </ThemedText>
          ) : null}
          <Button
            label={busy ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}
            onPress={() => void save()}
            disabled={busy || !form.title.trim() || !form.priceUsd.trim()}
          />
        </View>
      </BottomSheet>

      <BottomSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} title="Store settings">
        <View style={styles.form}>
          <TextInput
            style={inputStyle}
            placeholder="Store display name"
            placeholderTextColor={colors.mutedForeground}
            value={settings.displayName}
            onChangeText={(displayName) => setSettings((s) => ({ ...s, displayName }))}
          />
          <TextInput
            style={[inputStyle, styles.multiline]}
            placeholder="Store description"
            placeholderTextColor={colors.mutedForeground}
            value={settings.description}
            onChangeText={(description) => setSettings((s) => ({ ...s, description }))}
          />
          <View style={styles.typeRow}>
            <Pressable
              style={[styles.typeBtn, settings.shippingFree && styles.typeBtnOn]}
              onPress={() => setSettings((s) => ({ ...s, shippingFree: true }))}
            >
              <ThemedText variant="bodyMedium" primary={settings.shippingFree}>
                Free shipping
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.typeBtn, !settings.shippingFree && styles.typeBtnOn]}
              onPress={() => setSettings((s) => ({ ...s, shippingFree: false }))}
            >
              <ThemedText variant="bodyMedium" primary={!settings.shippingFree}>
                Flat rate
              </ThemedText>
            </Pressable>
          </View>
          {!settings.shippingFree && (
            <TextInput
              style={inputStyle}
              placeholder="Shipping fee USD"
              placeholderTextColor={colors.mutedForeground}
              value={settings.shippingFeeUsd}
              onChangeText={(shippingFeeUsd) => setSettings((s) => ({ ...s, shippingFeeUsd }))}
              keyboardType="decimal-pad"
            />
          )}
          {error ? (
            <ThemedText variant="caption" style={{ color: colors.destructive }}>
              {error}
            </ThemedText>
          ) : null}
          <Button label={busy ? 'Saving…' : 'Save store settings'} onPress={() => void saveSettings()} disabled={busy} />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm, gap: spacing.md },
  sub: { marginBottom: spacing.sm },
  center: { paddingVertical: spacing.xl, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.8),
  },
  img: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.muted },
  previewImg: { width: '100%', height: 160, borderRadius: radius.lg, backgroundColor: colors.muted },
  info: { flex: 1, gap: 2 },
  form: { gap: spacing.md },
  typeRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: withAlpha(colors.secondary, 0.6),
    gap: 4,
  },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.full },
  typeBtnOn: { backgroundColor: withAlpha(colors.primary, 0.15) },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
});
