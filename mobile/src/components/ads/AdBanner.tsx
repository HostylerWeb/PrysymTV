import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import {
  buildAdAttribution,
  fetchServedAd,
  trackAdClick,
  trackAdImpression,
  type ServedAd,
} from '@/lib/api/ads';
import { useMockAuth } from '@/context/MockAuthContext';
import { usePublicAdsConfig } from '@/hooks/api/usePublicAdsConfig';
import { useShouldShowAds } from '@/hooks/useShouldShowAds';
import { resolveAdMediaUrl } from '@/lib/ad-media';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = { onPress?: () => void };

export function AdBanner({ onPress }: Props) {
  const shouldShow = useShouldShowAds();
  const { user } = useMockAuth();
  const { platformCreatorId } = usePublicAdsConfig();
  const [ad, setAd] = useState<ServedAd | null>(null);

  useEffect(() => {
    if (!shouldShow) {
      setAd(null);
      return;
    }
    void fetchServedAd('home_banner').then((served) => {
      setAd(served);
      if (served) {
        void trackAdImpression(
          buildAdAttribution({
            campaignId: served.id,
            placement: 'home_banner',
            platformCreatorId,
            viewerUserId: user?.id,
          }),
        );
      }
    });
  }, [shouldShow, platformCreatorId, user?.id]);

  if (!ad) return null;

  const mediaUrl = resolveAdMediaUrl(ad.mediaUrl);
  if (!mediaUrl) return null;

  const openAd = () => {
    onPress?.();
    void trackAdClick(
      buildAdAttribution({
        campaignId: ad.id,
        placement: 'home_banner',
        platformCreatorId,
        viewerUserId: user?.id,
      }),
    );
    void Linking.openURL(ad.clickThroughUrl);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>Sponsored</Text>
      <Pressable style={styles.banner} onPress={openAd}>
        <Image source={{ uri: mediaUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
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
