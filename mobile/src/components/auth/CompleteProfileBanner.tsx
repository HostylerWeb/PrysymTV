import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { useMockAuth } from '@/context/MockAuthContext';
import {
  getMissingProfileFields,
  needsProfileCompletion,
  profileCompletionMessage,
} from '@/lib/profile-completion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export function CompleteProfileBanner() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated, sessionReady } = useMockAuth();
  const [editOpen, setEditOpen] = useState(false);

  const missing = useMemo(
    () =>
      getMissingProfileFields(
        user
          ? {
              gender: user.gender,
              birthDate: user.birthDate,
              avatarUrl: user.avatarUrl,
              bannerUrl: user.bannerUrl,
            }
          : null,
      ),
    [user],
  );

  const onAuthScreen =
    pathname.startsWith('/(auth)') ||
    pathname === '/welcome' ||
    pathname === '/login' ||
    pathname === '/register';

  if (
    !sessionReady ||
    !isAuthenticated ||
    !user ||
    onAuthScreen ||
    !needsProfileCompletion({
      gender: user.gender,
      birthDate: user.birthDate,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
    })
  ) {
    return null;
  }

  const message = profileCompletionMessage(missing);

  return (
    <>
      <View
        style={[
          styles.wrap,
          {
            paddingTop: insets.top + spacing.xs,
            backgroundColor: colors.primary + '18',
            borderBottomColor: colors.primary + '33',
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.foreground }]}>{message}</Text>
        <Pressable
          onPress={() => setEditOpen(true)}
          style={[styles.btn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Continue profile setup"
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Continue setup</Text>
        </Pressable>
      </View>
      <EditProfileModal visible={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
    alignItems: 'center',
  },
  text: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  btnText: { fontSize: 13, fontWeight: '600' },
});
