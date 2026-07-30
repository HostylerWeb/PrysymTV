import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { PlayerShell } from '@/components/video/PlayerShell';
import { TvUpsellBanner } from '@/components/tv/TvUpsellBanner';
import { useStreamDetail } from '@/hooks/api/useStreamDetail';
import { colors, spacing, typography } from '@/theme/tokens';

export default function LiveWatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useStreamDetail(id);

  const needsPaywall = Boolean(data?.isPaid) && !data?.hasAccess;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !data ? (
        <View style={styles.center}>
          <Text style={styles.error}>Could not load live stream.</Text>
        </View>
      ) : needsPaywall ? (
        <TvUpsellBanner
          title="Paid live stream"
          message="This stream requires coins or a purchase. Open PrysymTV on your phone or at prysym.tv to unlock, then return here."
        />
      ) : (
        <PlayerShell
          title={data.title}
          subtitle={`${data.streamer} · ${data.viewerCount} watching`}
          playbackUrl={data.playbackSource}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.foreground,
    fontSize: typography.heading,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    color: colors.mutedForeground,
    fontSize: typography.body,
    textAlign: 'center',
    maxWidth: 480,
  },
  error: { color: '#ff6b6b', fontSize: typography.body },
});
