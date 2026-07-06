import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { colors, typography } from '@/theme/tokens';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.sub}>This route doesn’t exist on Prysym TV mobile.</Text>
      <Button label="Go home" onPress={() => router.replace('/(tabs)/home')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  code: { color: colors.primary, fontSize: 48, fontWeight: '900' },
  title: { ...typography.h1, color: colors.foreground },
  sub: { color: colors.mutedForeground, textAlign: 'center', marginBottom: 8 },
});
