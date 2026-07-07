import React from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useMockAuth } from '@/context/MockAuthContext';
import { colors, spacing } from '@/theme/tokens';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useMockAuth();

  const enterAsGuest = async () => {
    await continueAsGuest();
    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.hero}>
        <Image source={require('../assets/logo.webp')} style={styles.logo} contentFit="contain" />
        <Text style={styles.tagline}>Movies, live streams, and creators — all in one place.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Sign in"
          onPress={() => router.push('/(auth)/login')}
        />
        <Button
          label="Create account"
          variant="secondary"
          onPress={() => router.push('/(auth)/register')}
        />
        <Button label="Continue as guest" variant="ghost" onPress={enterAsGuest} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.page, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 160, height: 42, marginBottom: 16 },
  tagline: {
    color: colors.mutedForeground,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: { gap: 10 },
});
