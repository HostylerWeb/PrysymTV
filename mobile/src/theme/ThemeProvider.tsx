import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors } from '@/theme/tokens';

const STORAGE_KEY = 'prysym_theme';

type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setDarkMode: (enabled: boolean) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') setMode(stored);
      })
      .finally(() => setReady(true));
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    const next: ThemeMode = enabled ? 'dark' : 'light';
    setMode(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors: (mode === 'dark' ? darkColors : lightColors) as ThemeColors,
      setDarkMode,
      toggleTheme,
    }),
    [mode, setDarkMode, toggleTheme],
  );

  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'dark' as ThemeMode,
      isDark: true,
      colors: darkColors,
      setDarkMode: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
