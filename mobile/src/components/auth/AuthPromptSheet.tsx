import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, spacing } from '@/theme/tokens';

export function AuthPromptSheet() {
  const router = useRouter();
  const { authPromptVisible, authPromptMode, closeAuthPrompt } = useMockAuth();

  const goLogin = () => {
    closeAuthPrompt();
    router.push('/(auth)/login');
  };

  const goRegister = () => {
    closeAuthPrompt();
    router.push('/(auth)/register');
  };

  return (
    <BottomSheet
      visible={authPromptVisible}
      onClose={closeAuthPrompt}
      title="Sign in to continue"
      height="38%"
      scroll={false}
    >
      <Text style={styles.sub}>
        {authPromptMode === 'register'
          ? 'Create a free account to unlock this feature.'
          : 'Sign in to like, save, comment, and more.'}
      </Text>

      <Button label="Sign in" onPress={goLogin} style={styles.cta} />
      <Button label="Create account" variant="secondary" onPress={goRegister} style={styles.cta} />
      <Button label="Continue browsing" variant="ghost" onPress={closeAuthPrompt} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sub: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cta: { marginBottom: 8 },
});
