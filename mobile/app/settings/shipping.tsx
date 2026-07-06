import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { AppHeader } from '@/components/layout/AppHeader';
import { BuyerDetailsForm } from '@/components/forms/BuyerDetailsForm';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { colors, spacing } from '@/theme/tokens';
import { EMPTY_BUYER_DETAILS, isBuyerDetailsComplete } from '@/types/buyer-details';

export default function ShippingSettingsScreen() {
  const [details, setDetails] = useState(EMPTY_BUYER_DETAILS);

  const save = () => {
    if (!isBuyerDetailsComplete(details)) {
      Alert.alert('Incomplete', 'Fill in all required shipping fields.');
      return;
    }
    Alert.alert('Saved (mock)', 'Shipping details will sync to PUT /users/me in Phase C.');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.pad}>
        <AppHeader showBack title="Shipping details" showNotifications={false} />
        <ThemedText variant="bodyMedium" muted style={styles.sub}>
          Pre-fills store checkout for physical products - mirrors web Profile → Settings → Shipping
        </ThemedText>
        <BuyerDetailsForm value={details} onChange={setDetails} />
        <Button label="Save shipping details" onPress={save} style={{ marginTop: spacing.lg }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: spacing.page, gap: spacing.md },
  sub: { marginBottom: spacing.sm },
});
