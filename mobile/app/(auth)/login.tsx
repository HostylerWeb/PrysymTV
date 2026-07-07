import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import {
  OAuthSignInButtons,
  isMobileOAuthConfigured,
} from '@/components/auth/OAuthSignInButtons';
import { useMockAuth, getAuthErrorMessage } from '@/context/MockAuthContext';
import { colors, radius, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle, loginWithApple } = useMockAuth();
  const [email, setEmail] = useState('demo@prysym.tv');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const handleLogin = async () => {
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      finish();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.logo}>Prysym</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.sub}>Use your Prysym account or continue with a provider</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.mutedForeground} secureTextEntry />
      <Button label={busy ? 'Signing in…' : 'Sign in'} onPress={() => void handleLogin()} disabled={busy} />
      {isMobileOAuthConfigured() ? (
        <OAuthSignInButtons
          disabled={busy}
          onGoogleCredential={async (idToken) => {
            setError('');
            setBusy(true);
            try {
              await loginWithGoogle(idToken);
              finish();
            } catch (err) {
              setError(getAuthErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
          onAppleCredential={async (identityToken, authorizationCode) => {
            setError('');
            setBusy(true);
            try {
              await loginWithApple(identityToken, authorizationCode);
              finish();
            } catch (err) {
              setError(getAuthErrorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
          onError={(message) => setError(message)}
        />
      ) : null}
      <Button label="Create account" variant="ghost" onPress={() => router.replace('/(auth)/register')} />
      <Button label="Forgot password?" variant="ghost" onPress={() => router.push('/(auth)/forgot-password')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, gap: 12 },
  logo: { fontSize: 28, fontWeight: '900', color: colors.primary, marginBottom: 8 },
  title: { ...typography.h1, color: colors.foreground },
  sub: { color: colors.mutedForeground, marginBottom: 12 },
  error: { color: colors.destructive, fontSize: 14 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, color: colors.foreground, fontSize: 15 },
});
