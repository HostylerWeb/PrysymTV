import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { AuthErrorBox, AuthFormField } from '@/components/auth/AuthFormField';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const invalidToken = !token || token.length < 8;

  const handleSubmit = async () => {
    if (invalidToken) {
      setError('This reset link is invalid or expired. Request a new one.');
      return;
    }
    if (!password || !confirm) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      // UI-only — API wiring in next phase (POST /auth/reset-password)
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (invalidToken && !done) {
    return (
      <View
        style={[
          styles.screen,
          styles.centered,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={[styles.iconCircle, styles.iconCircleError]}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.destructive} />
        </View>
        <Text style={styles.title}>Invalid reset link</Text>
        <Text style={styles.sub}>
          Open the link from your email or request a new password reset.
        </Text>
        <Button
          label="Request new link"
          onPress={() => router.replace('/(auth)/forgot-password')}
          size="lg"
          style={styles.cta}
        />
      </View>
    );
  }

  if (done) {
    return (
      <View
        style={[
          styles.screen,
          styles.centered,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle-outline" size={28} color={colors.success} />
        </View>
        <Text style={styles.title}>Password updated</Text>
        <Text style={styles.sub}>You can now sign in with your new password.</Text>
        <Button
          label="Sign in"
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
      <Text style={styles.title}>Set new password</Text>
      <Text style={styles.sub}>Choose a strong password with at least 8 characters.</Text>

      <AuthErrorBox message={error} />

      <AuthFormField
        icon="lock-closed-outline"
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        secureTextEntry
        autoComplete="new-password"
        editable={!busy}
      />
      <AuthFormField
        icon="lock-closed-outline"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm password"
        secureTextEntry
        autoComplete="new-password"
        editable={!busy}
      />

      <Button
        label={busy ? 'Updating…' : 'Update password'}
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleError: {
    backgroundColor: colors.destructive + '18',
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
