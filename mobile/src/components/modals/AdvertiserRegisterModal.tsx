import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import type { AdvertiserAccount } from '@/lib/api/advertisers';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  hasPending?: boolean;
  pendingAccount?: AdvertiserAccount | null;
  onSubmitted?: (data: { companyName: string; contactEmail: string; billingEmail?: string }) => void;
  onCancelPending?: () => void;
};

export function AdvertiserRegisterModal({
  visible,
  onClose,
  hasPending = false,
  pendingAccount,
  onSubmitted,
  onCancelPending,
}: Props) {
  const { colors } = useTheme();
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  if (hasPending && pendingAccount) {
    return (
      <BottomSheet visible={visible} onClose={onClose} title="Pending registration">
        <Text style={[styles.pendingTitle, { color: colors.foreground }]}>{pendingAccount.companyName}</Text>
        <Text style={[styles.pendingSub, { color: colors.mutedForeground }]}>{pendingAccount.contactEmail}</Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Under review · Our team typically responds within 1–2 business days.
        </Text>
        <Button
          label="Cancel pending request"
          variant="outline"
          onPress={() => {
            onCancelPending?.();
            onClose();
          }}
          style={{ marginTop: 12 }}
        />
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Advertiser account">
      <Text style={[styles.hint, { color: colors.mutedForeground, marginBottom: 12 }]}>
        Register your business to start the verification process.
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
        placeholder="Company name"
        placeholderTextColor={colors.mutedForeground}
        value={company}
        onChangeText={setCompany}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
        placeholder="Contact email"
        placeholderTextColor={colors.mutedForeground}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.secondary, color: colors.foreground }]}
        placeholder="Billing email (optional)"
        placeholderTextColor={colors.mutedForeground}
        value={billingEmail}
        onChangeText={setBillingEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        label="Submit registration"
        disabled={!company.trim() || !email.trim()}
        onPress={() => {
          onSubmitted?.({
            companyName: company.trim(),
            contactEmail: email.trim(),
            billingEmail: billingEmail.trim() || undefined,
          });
          setCompany('');
          setEmail('');
          setBillingEmail('');
          onClose();
        }}
        style={{ marginTop: 12 }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  pendingTitle: { fontSize: 18, fontWeight: '700' },
  pendingSub: { marginTop: 4 },
  hint: { fontSize: 13, lineHeight: 18 },
});
