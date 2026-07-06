import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { MockAuthProvider } from '@/context/MockAuthContext';
import { PodcastPlayerProvider } from '@/context/PodcastPlayerContext';
import { AuthPromptSheet } from '@/components/auth/AuthPromptSheet';
import { StoreCartProvider } from '@/context/StoreCartContext';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <MockAuthProvider>
          <PodcastPlayerProvider>
          <StoreCartProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
            <Stack.Screen name="search" options={{ presentation: 'modal' }} />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="watch/[id]" />
            <Stack.Screen name="movie/[id]" />
            <Stack.Screen name="live/index" />
            <Stack.Screen name="live/[id]" />
            <Stack.Screen name="podcast/[id]" />
            <Stack.Screen name="creator/[username]" />
            <Stack.Screen name="creator/[username]/store/[productId]" />
            <Stack.Screen name="creator/[username]/store/cart" />
            <Stack.Screen name="verticals/[slug]" />
            <Stack.Screen name="verticals/watch/[slug]/[episode]" />
            <Stack.Screen name="playlist/[id]" />
            <Stack.Screen name="history" />
            <Stack.Screen name="premium" />
            <Stack.Screen name="advertise" />
            <Stack.Screen name="advertisers" />
            <Stack.Screen name="go-live" />
            <Stack.Screen name="upload" />
            <Stack.Screen name="creator-dashboard" />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="settings/notifications" />
            <Stack.Screen name="settings/dashboard" />
            <Stack.Screen name="settings/upload" />
            <Stack.Screen name="settings/verticals" />
            <Stack.Screen name="settings/podcasts" />
            <Stack.Screen name="settings/playlists" />
            <Stack.Screen name="settings/social" />
            <Stack.Screen name="settings/shipping" />
            <Stack.Screen name="shorts/[id]" />
            <Stack.Screen name="cookies" />
            <Stack.Screen name="help" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="guidelines" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <AuthPromptSheet />
          </StoreCartProvider>
          </PodcastPlayerProvider>
        </MockAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
