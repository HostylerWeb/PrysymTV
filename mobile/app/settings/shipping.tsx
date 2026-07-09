import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { BuyerDetailsForm } from '@/components/forms/BuyerDetailsForm';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useMockAuth } from '@/context/MockAuthContext';
import { getAuthErrorMessage } from '@/lib/api/client';
import { updateMe } from '@/lib/api/users';
import { colors, spacing } from '@/theme/tokens';
import {
  buyerDetailsFromUser,
  buyerDetailsToUpdateMeBody,
  EMPTY_BUYER_DETAILS,
  isBuyerDetailsComplete,
  type BuyerDetails,
} from '@/types/buyer-details';

export default function ShippingSettingsScreen() {
  const router = useRouter();
  const { user, refreshUser } = useMockAuth();
  const [details, setDetails] = useState<BuyerDetails>(EMPTY_BUYER_DETAILS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDetails(buyerDetailsFromUser(user));
    setLoading(false);
  }, [user]);

  const save = async () => {
    if (!isBuyerDetailsComplete(details)) {
      Alert.alert('Incomplete', 'Fill in all required shipping fields.');
      return;
    }
    setBusy(true);
    try {
      await updateMe(buyerDetailsToUpdateMeBody(details));
      await refreshUser();
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    } catch (err) {
      Alert.alert('Could not save', getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Shipping details" showNotifications={false} />
        <ThemedText variant="bodyMedium" muted style={styles.sub}>
          Pre-fills store checkout for physical products — mirrors web Profile → Settings → Shipping
        </ThemedText>
        <BuyerDetailsForm value={details} onChange={setDetails} />
        <Button
          label={busy ? 'Saving…' : 'Save shipping details'}
          onPress={() => void save()}
          disabled={busy}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: spacing.page, gap: spacing.md },
  sub: { marginBottom: spacing.sm },
});
