import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  videoId?: string;
  creatorId?: string;
  onClose: () => void;
};

export function AdInterstitial({ visible, videoId, creatorId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const shouldShow = useShouldShowAds();
  const { user } = useMockAuth();
  const { platformCreatorId } = usePublicAdsConfig();
  const [ad, setAd] = useState<ServedAd | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReady(false);
    if (!shouldShow) {
      onClose();
      return;
    }
    void fetchServedAd('shorts_interstitial').then((served) => {
      if (!served) {
        onClose();
        return;
      }
      setAd(served);
      setCountdown(served.skipAfterSeconds);
      void trackAdImpression(
        buildAdAttribution({
          campaignId: served.id,
          placement: 'shorts_interstitial',
          creatorId,
          platformCreatorId,
          videoId,
          viewerUserId: user?.id,
        }),
      );
    });
  }, [visible, shouldShow, creatorId, videoId, platformCreatorId, user?.id, onClose]);

  useEffect(() => {
    if (!visible || !ad || !ready || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, ad, ready, countdown]);

  if (!visible || !ad) return null;

  const mediaUrl = resolveAdMediaUrl(ad.mediaUrl);
  if (!mediaUrl) return null;

  const openAd = () => {
    void trackAdClick(
      buildAdAttribution({
        campaignId: ad.id,
        placement: 'shorts_interstitial',
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
    void Linking.openURL(ad.clickThroughUrl);
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={openAd}>
            <Text style={styles.sponsor} numberOfLines={1}>Sponsored · {ad.title}</Text>
          </Pressable>
          {ready && countdown <= 0 ? (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          ) : ready ? (
            <Text style={styles.countdown}>Close in {countdown}s</Text>
          ) : (
            <Text style={styles.countdown}>Loading…</Text>
          )}
        </View>
        <Image
          source={{ uri: mediaUrl }}
          style={styles.media}
          contentFit="cover"
          onLoad={() => setReady(true)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  sponsor: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecorationLine: 'underline' },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  closeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  countdown: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  media: { flex: 1, width: '100%' },
});
