import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme/tokens';

type Props = {
  title?: string;
  message?: string;
};

/** Shown when TV cannot complete purchases / coins — directs users to phone or web. */
export function TvUpsellBanner({
  title = 'Use phone or web for this',
  message = 'Buying coins, premium, or paid unlocks is not available on TV. Open PrysymTV on your phone or at prysym.tv to continue.',
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
