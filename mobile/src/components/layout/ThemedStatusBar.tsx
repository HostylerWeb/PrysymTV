import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useImmersivePlayback } from '@/context/ImmersivePlaybackContext';
import { useTheme } from '@/theme/ThemeProvider';

export function ThemedStatusBar() {
  const { isDark } = useTheme();
  const { immersive } = useImmersivePlayback();
  return <StatusBar style={isDark ? 'light' : 'dark'} hidden={immersive} />;
}
