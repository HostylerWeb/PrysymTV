import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildAdAttribution,
  isValidServedAd,
  trackAdClick,
  trackAdImpression,
  type ServedAd,
} from '@/lib/api/ads';
import { AdMedia } from '@/components/ads/AdMedia';
import { useMockAuth } from '@/context/MockAuthContext';
import { usePublicAdsConfig } from '@/hooks/api/usePublicAdsConfig';
import { useShouldShowAds } from '@/hooks/useShouldShowAds';
import { resolveAdMediaUrl } from '@/lib/ad-media';
import { radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  videoId?: string;
  creatorId?: string;
  servedAd?: ServedAd | null;
  onComplete: () => void;
};

export function VerticalEpisodeAdGate({
  visible,
  videoId,
  creatorId,
  servedAd,
  onComplete,
}: Props) {
  const insets = useSafeAreaInsets();
  const shouldShow = useShouldShowAds();
  const { user } = useMockAuth();
  const { platformCreatorId, isPlacementEnabled } = usePublicAdsConfig();
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined);
  const [countdown, setCountdown] = useState(5);
  const [ready, setReady] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!visible) {
      setAd(undefined);
      return;
    }
    setReady(false);
    if (!shouldShow || !isPlacementEnabled('vertical_episode')) {
      onCompleteRef.current();
      return;
    }

    if (servedAd !== undefined) {
      const valid = isValidServedAd(servedAd) ? servedAd : null;
      setAd(valid);
      if (!valid) onCompleteRef.current();
      return;
    }

    onCompleteRef.current();
  }, [visible, shouldShow, servedAd, isPlacementEnabled]);

  useEffect(() => {
    if (!ad) return;
    void trackAdImpression(
      buildAdAttribution({
        campaignId: ad.id,
        placement: 'vertical_episode',
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
  }, [ad, creatorId, videoId, platformCreatorId, user?.id]);

  useEffect(() => {
    if (!visible || !ad) return;
    if (ready && countdown <= 0) {
      onCompleteRef.current();
      return;
    }
    if (!ready || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, ad, ready, countdown]);

  useEffect(() => {
    if (!visible || ad === undefined) return;
    if (ad && ready) setCountdown(ad.skipAfterSeconds);
  }, [visible, ad, ready]);

  if (!visible || ad === undefined || !ad) return null;

  const mediaUrl = resolveAdMediaUrl(ad.mediaUrl);
  if (!mediaUrl) return null;

  const openAd = () => {
    void trackAdClick(
      buildAdAttribution({
        campaignId: ad.id,
        placement: 'vertical_episode',
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
    void Linking.openURL(ad.clickThroughUrl);
  };

  if (!ready) {
    return (
      <View style={styles.preload} pointerEvents="none">
        <AdMedia
          mediaUrl={mediaUrl}
          mediaType={ad.mediaType}
          style={styles.media}
          contentFit="cover"
          onReady={() => setReady(true)}
          onError={() => onCompleteRef.current()}
        />
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => countdown <= 0 && onComplete()}>
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={openAd}>
            <Text style={styles.sponsor} numberOfLines={1}>Sponsored · {ad.title}</Text>
          </Pressable>
          {ready && countdown <= 0 ? (
            <Pressable style={styles.continueBtn} onPress={onComplete}>
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          ) : ready ? (
            <Text style={styles.countdown}>Continue in {countdown}s</Text>
          ) : (
            <Text style={styles.countdown}>Loading…</Text>
          )}
        </View>
        <AdMedia
          mediaUrl={mediaUrl}
          mediaType={ad.mediaType}
          style={styles.media}
          contentFit="cover"
          onReady={() => setReady(true)}
          onError={() => onCompleteRef.current()}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  preload: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
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
  continueBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  continueText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  countdown: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  media: { flex: 1, width: '100%' },
});
