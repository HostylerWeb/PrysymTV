import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, radius, typography } from '@/theme/tokens';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>Set new password</Text>
      <Text style={styles.sub}>
        {token ? `Token: ${token.slice(0, 8)}…` : 'Open from email link'} - mock POST /auth/reset-password
      </Text>
      <TextInput style={styles.input} placeholder="New password" placeholderTextColor={colors.mutedForeground} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor={colors.mutedForeground} secureTextEntry />
      <Button label="Update password" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, gap: 12 },
  title: { ...typography.h1, color: colors.foreground },
  sub: { color: colors.mutedForeground, marginBottom: 8 },
  input: { backgroundColor: colors.secondary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, color: colors.foreground },
});
