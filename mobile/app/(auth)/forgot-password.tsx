import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, radius, typography } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.sub}>Enter your email. Mock - POST /auth/forgot-password in Phase C.</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {sent ? (
        <>
          <Text style={styles.confirm}>Check your email for a reset link.</Text>
          <Button label="Open reset screen (mock)" onPress={() => router.push('/(auth)/reset-password?token=mock-token')} />
        </>
      ) : (
        <Button label="Send reset link" disabled={!email.trim()} onPress={() => setSent(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, gap: 12 },
  title: { ...typography.h1, color: colors.foreground },
  sub: { color: colors.mutedForeground, marginBottom: 8 },
  confirm: { color: colors.success, fontSize: 14 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, color: colors.foreground },
});
