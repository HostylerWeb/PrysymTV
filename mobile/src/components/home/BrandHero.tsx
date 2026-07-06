import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { colors, radius, spacing, withAlpha } from '@/theme/tokens';
import { commonStyles } from '@/theme/styles';

export function BrandHero() {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={[commonStyles.heroBrand, styles.card]}>
        <View style={commonStyles.heroGlow} />
        <View style={styles.inner}>
          <View style={styles.eyebrow}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <ThemedText variant="eyebrow" primary>
              Prysym TV
            </ThemedText>
          </View>
          <ThemedText variant="hero" style={styles.title}>
            Where content creates community wealth
          </ThemedText>
          <ThemedText variant="bodyMedium" muted style={styles.subtitle}>
            Stream movies, micro-dramas, live creators, and more - all in one place built for community.
          </ThemedText>
          <View style={styles.actions}>
            <Button
              label="Explore videos"
              onPress={() => router.push('/(tabs)/videos')}
              style={styles.cta}
            />
            <Button
              label="Browse series"
              variant="outline"
              onPress={() => router.push('/(tabs)/verticals')}
              style={styles.cta}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: withAlpha(colors.primary, 0.08),
  },
  inner: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 520,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  title: {
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  subtitle: {
    lineHeight: 22,
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cta: {
    paddingHorizontal: spacing.xl,
  },
});
