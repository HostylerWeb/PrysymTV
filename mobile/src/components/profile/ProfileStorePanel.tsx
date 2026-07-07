import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ThemedText } from '@/components/ui/ThemedText';
import { mockStoreProducts } from '@/mocks';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';

type ProductForm = {
  title: string;
  priceUsd: string;
  productType: 'merchandise' | 'digital';
  description: string;
};

const EMPTY_FORM: ProductForm = {
  title: '',
  priceUsd: '',
  productType: 'merchandise',
  description: '',
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
  const { user } = useMockAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [settings, setSettings] = useState({
    displayName: 'Prysym Creator Store',
    description: 'Official merch and digital downloads.',
    shippingFree: true,
    shippingFeeUsd: '5.99',
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    const p = mockStoreProducts.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setForm({
      title: p.title,
      priceUsd: p.priceUsd,
      productType: p.productType ?? 'merchandise',
      description: p.description ?? '',
    });
    setFormOpen(true);
  };

  const save = () => {
    Alert.alert('Saved (mock)', editingId ? 'Product updated.' : 'Product created.');
    setFormOpen(false);
  };

  const deleteProduct = (id: string, title: string) => {
    Alert.alert('Delete product', `Remove "${title}" from your store?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted (mock)', 'Product removed.') },
    ]);
  };

  const saveSettings = () => {
    Alert.alert('Saved (mock)', 'Store settings updated.');
    setSettingsOpen(false);
  };

  return (
    <>
      <View style={styles.wrap}>
        <ThemedText variant="h3">My store</ThemedText>
        <ThemedText variant="caption" muted style={styles.sub}>
          Create and edit products - same fields as the web Profile Store tab
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

        {mockStoreProducts.map((p) => (
          <View key={p.id} style={styles.product}>
            <Image source={{ uri: p.imageUrl ?? '' }} style={styles.img} contentFit="cover" />
            <View style={styles.info}>
              <ThemedText variant="bodyMedium">{p.title}</ThemedText>
              <ThemedText variant="caption" primary>
                ${p.priceUsd}
              </ThemedText>
              <ThemedText variant="micro" muted>
                {p.productType === 'digital' ? 'Digital' : 'Physical'} ·{' '}
                {p.inStock ? 'In stock' : 'Out of stock'}
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
        ))}
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
          <ThemedText variant="caption" muted>
            Add a product image from your photo library or camera roll.
          </ThemedText>
          <Button
            label={editingId ? 'Save changes' : 'Create product'}
            onPress={save}
            disabled={!form.title.trim() || !form.priceUsd.trim()}
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
            multiline
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
          <Button label="Save store settings" onPress={saveSettings} />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm, gap: spacing.md },
  sub: { marginBottom: spacing.sm },
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
