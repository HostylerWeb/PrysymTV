import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useMockAuth();
  const [email, setEmail] = useState('demo@prysym.tv');
  const [password, setPassword] = useState('password');

  const handleLogin = async () => {
    await login(email, password);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.logo}>Prysym</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.sub}>Mock auth - any values work for UI preview</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.mutedForeground} secureTextEntry />
      <Button label="Sign in" onPress={handleLogin} />
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
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, color: colors.foreground, fontSize: 15 },
});
