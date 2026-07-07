import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { AuthErrorBox, AuthFormField } from '@/components/auth/AuthFormField';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      // UI-only — API wiring in next phase (POST /auth/forgot-password)
      await new Promise((r) => setTimeout(r, 600));
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <View
        style={[
          styles.screen,
          styles.centered,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.sub}>
          If an account exists for {email.trim()}, we sent a password reset link. It expires in 15
          minutes.
        </Text>
        <Button
          label="Back to sign in"
          onPress={() => router.replace('/(auth)/login')}
          size="lg"
          style={styles.cta}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={colors.foreground} />
      </Pressable>

      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.sub}>We will email you a link to reset your password.</Text>

      <AuthErrorBox message={error} />

      <AuthFormField
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        editable={!busy}
      />

      <Button
        label={busy ? 'Sending…' : 'Send reset link'}
        onPress={() => void handleSubmit()}
        disabled={busy}
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.page, gap: 12 },
  centered: {
    paddingHorizontal: spacing.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { alignSelf: 'flex-start', marginBottom: 4 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { ...typography.h1, color: colors.foreground, textAlign: 'center' },
  sub: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 8,
  },
  cta: { marginTop: 20, alignSelf: 'stretch' },
});
