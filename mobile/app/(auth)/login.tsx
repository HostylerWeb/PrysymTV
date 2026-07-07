import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { AuthErrorBox, AuthFormField } from '@/components/auth/AuthFormField';
import { OAuthSignInButtons } from '@/components/auth/OAuthSignInButtons';
import { useOAuthAuthHandlers } from '@/components/auth/useOAuthAuthHandlers';
import { useMockAuth, getAuthErrorMessage } from '@/context/MockAuthContext';
import { colors, spacing, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useMockAuth();
  const [email, setEmail] = useState(__DEV__ ? 'demo@prysym.tv' : '');
  const [password, setPassword] = useState(__DEV__ ? 'password' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = () => {
    router.replace('/(tabs)/home');
  };

  const oauth = useOAuthAuthHandlers({
    onSuccess: finish,
    setError,
    setBusy,
    busy,
  });

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      finish();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
          style={styles.back}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>

        <Text style={styles.title}>Sign in</Text>

        <View style={styles.form}>
          <AuthErrorBox message={error} />

          <AuthFormField
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!busy}
          />
          <AuthFormField
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoComplete="password"
            editable={!busy}
          />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            disabled={busy}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Button
            label={busy ? 'Signing in…' : 'Sign in'}
            onPress={() => void handleLogin()}
            disabled={busy}
            size="lg"
          />
        </View>

        <View style={styles.oauth}>
          <OAuthSignInButtons
            disabled={busy}
            preferMockSignIn
            onGoogleCredential={oauth.onGoogleCredential}
            onAppleCredential={oauth.onAppleCredential}
            onError={oauth.onOAuthError}
            showDivider
            dividerPosition="above"
            dividerLabel="or continue with"
          />
        </View>

        <Pressable
          onPress={() => router.replace('/(auth)/register')}
          disabled={busy}
          style={styles.registerRow}
        >
          <Text style={styles.registerMuted}>New here? </Text>
          <Text style={styles.registerLink}>Create an account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.page },
  back: { alignSelf: 'flex-start', marginBottom: 20 },
  title: {
    ...typography.h1,
    color: colors.foreground,
    fontSize: 28,
    marginBottom: 20,
  },
  form: { gap: 12 },
  oauth: { marginTop: 20 },
  forgotLink: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    paddingVertical: 8,
  },
  registerMuted: { color: colors.mutedForeground, fontSize: 14 },
  registerLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
