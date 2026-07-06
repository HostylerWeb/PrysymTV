import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, radius, spacing } from '@/theme/tokens';

const GUEST_LIMITS = [
  { icon: 'heart-outline' as const, text: 'Like, save, and subscribe to creators' },
  { icon: 'chatbubble-outline' as const, text: 'Comment and join live chat' },
  { icon: 'gift-outline' as const, text: 'Send gifts and buy creator products' },
  { icon: 'add-circle-outline' as const, text: 'Upload content and go live' },
  { icon: 'bookmark-outline' as const, text: 'Build playlists and continue watching' },
];

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
      height="88%"
    >
      <Text style={styles.sub}>
        Guests can browse and watch. Create a free account to unlock the full Prysym TV experience.
      </Text>
      <View style={styles.list}>
        {GUEST_LIMITS.map((item) => (
          <View key={item.text} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.rowText}>{item.text}</Text>
          </View>
        ))}
      </View>
      <Button
        label="Sign in"
        onPress={goLogin}
        style={styles.cta}
      />
      <Button
        label="Create account"
        variant="secondary"
        onPress={goRegister}
        style={styles.cta}
      />
      <Button label="Continue browsing" variant="ghost" onPress={closeAuthPrompt} />
      {authPromptMode === 'register' ? (
        <Text style={styles.hint}>You opened this from a sign-up action. Tap Create account above.</Text>
      ) : null}
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
  list: { gap: 10, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, color: colors.foreground, fontSize: 13, lineHeight: 18 },
  cta: { marginBottom: 8 },
  hint: { color: colors.mutedForeground, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
