import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius, typography } from '@/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useMockAuth();

  const handleRegister = async () => {
    await register();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.title}>Create account</Text>
      <TextInput style={styles.input} placeholder="Display name" placeholderTextColor={colors.mutedForeground} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Username" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.mutedForeground} secureTextEntry />
      <Button label="Register" onPress={handleRegister} />
      <Button label="Already have an account?" variant="ghost" onPress={() => router.replace('/(auth)/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, gap: 12 },
  title: { ...typography.h1, color: colors.foreground, marginBottom: 8 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, color: colors.foreground, fontSize: 15 },
});
