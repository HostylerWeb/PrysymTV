import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  hasPending?: boolean;
  onSubmitted?: () => void;
};

export function AdvertiserRegisterModal({
  visible,
  onClose,
  hasPending = false,
  onSubmitted,
}: Props) {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');

  if (hasPending) {
    return (
      <BottomSheet visible={visible} onClose={onClose} title="Pending registration">
        <Text style={styles.pendingTitle}>Acme Corp</Text>
        <Text style={styles.pendingSub}>Under review · contact@acme.com</Text>
        <Text style={styles.hint}>Cancel to submit updated details.</Text>
        <Button label="Cancel pending request" variant="outline" onPress={onClose} style={{ marginTop: 12 }} />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Advertiser account">
      <TextInput
        style={styles.input}
        placeholder="Company name"
        placeholderTextColor={colors.mutedForeground}
        value={company}
        onChangeText={setCompany}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact email"
        placeholderTextColor={colors.mutedForeground}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        label="Submit registration"
        onPress={() => {
          onSubmitted?.();
          onClose();
        }}
        style={{ marginTop: 12 }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.foreground,
    marginBottom: 10,
  },
  pendingTitle: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
  pendingSub: { color: colors.mutedForeground, marginTop: 4 },
  hint: { color: colors.mutedForeground, fontSize: 13, marginTop: 12 },
});
