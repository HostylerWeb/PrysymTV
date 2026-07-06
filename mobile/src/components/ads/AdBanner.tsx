import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MOCK_HOME_BANNER_AD } from '@/components/ads/mock-ad-data';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = { onPress?: () => void };

export function AdBanner({ onPress }: Props) {
  const ad = MOCK_HOME_BANNER_AD;

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Sponsored</Text>
      <Pressable
        style={styles.banner}
        onPress={() => {
          onPress?.();
          void Linking.openURL(ad.clickThroughUrl);
        }}
      >
        <Image source={{ uri: ad.mediaUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.scrim} />
        <Text style={styles.title}>{ad.title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, paddingHorizontal: spacing.page },
  eyebrow: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  banner: {
    height: 72,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'flex-end',
    padding: 12,
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  title: { color: '#fff', fontWeight: '700', fontSize: 14, zIndex: 1 },
});
