import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { useMockAuth } from '@/context/MockAuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export function CompleteProfileBanner() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated, sessionReady } = useMockAuth();
  const [editOpen, setEditOpen] = useState(false);

  if (!sessionReady || !isAuthenticated || !user || user.gender) {
    return null;
  }

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
        <Text style={[styles.text, { color: colors.foreground }]}>
          Complete your profile — add your gender so we can personalize your experience.
        </Text>
        <Pressable
          onPress={() => setEditOpen(true)}
          style={[styles.btn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Complete profile</Text>
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
  },
  text: { fontSize: 13, lineHeight: 18 },
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  btnText: { fontSize: 13, fontWeight: '600' },
});
