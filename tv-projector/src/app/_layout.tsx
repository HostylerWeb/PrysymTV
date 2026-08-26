import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OtaUpdatePrompt } from '@/components/ota/OtaUpdatePrompt';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useOtaUpdates } from '@/hooks/useOtaUpdates';
import { QueryProvider } from '@/providers/QueryProvider';
import { colors } from '@/theme/tokens';
import { useRouter, useSegments } from 'expo-router';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === 'login';
    if (!isAuthenticated && !inAuth) {
      router.replace('/login');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(main)');
    }
  }, [ready, isAuthenticated, segments, router]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const otaUpdate = useOtaUpdates();

  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <OtaUpdatePrompt state={otaUpdate} />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="watch/[id]" options={{ animation: 'none' }} />
            <Stack.Screen name="shorts/[id]" options={{ animation: 'none' }} />
            <Stack.Screen name="live/[id]" options={{ animation: 'none' }} />
            <Stack.Screen name="podcast/[id]" options={{ animation: 'none' }} />
            <Stack.Screen
              name="verticals/watch/[slug]/[episode]"
              options={{ animation: 'none' }}
            />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </QueryProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
