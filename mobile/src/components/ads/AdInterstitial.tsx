import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildAdAttribution,
  fetchServedAd,
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
import {
  canSkipImageAd,
  canSkipVideoAd,
  videoAdSkipSecondsRemaining,
} from '@/lib/ad-skip-timing';
import { radius } from '@/theme/tokens';

type Props = {
  visible: boolean;
  videoId?: string;
  creatorId?: string;
  servedAd?: ServedAd | null;
  onClose: () => void;
};

export function AdInterstitial({ visible, videoId, creatorId, servedAd, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const shouldShow = useShouldShowAds();
  const { user } = useMockAuth();
  const { platformCreatorId, isPlacementEnabled } = usePublicAdsConfig();
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined);
  const [imageCountdown, setImageCountdown] = useState(5);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isVideoAd = ad?.mediaType === 'video';

  useEffect(() => {
    if (!visible) {
      setAd(undefined);
      setReady(false);
      setAdCurrentTime(0);
      setAdDuration(0);
      return;
    }
    setReady(false);
    setAdCurrentTime(0);
    setAdDuration(0);
    if (!shouldShow || !isPlacementEnabled('shorts_interstitial')) {
      onCloseRef.current();
      return;
    }

    if (servedAd !== undefined) {
      const valid = isValidServedAd(servedAd) ? servedAd : null;
      setAd(valid);
      if (!valid) onCloseRef.current();
      return;
    }

    void fetchServedAd('shorts_interstitial', { peek: true })
      .then((peek) => {
        const valid = isValidServedAd(peek) ? peek : null;
        setAd(valid);
        if (!valid) onCloseRef.current();
      })
      .catch(() => onCloseRef.current());
  }, [visible, shouldShow, servedAd, isPlacementEnabled]);

  useEffect(() => {
    if (!ad) return;
    void trackAdImpression(
      buildAdAttribution({
        campaignId: ad.id,
        placement: 'shorts_interstitial',
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
  }, [ad, creatorId, videoId, platformCreatorId, user?.id]);

  useEffect(() => {
    if (!ad || !ready || isVideoAd) return;
    setImageCountdown(ad.skipAfterSeconds || 5);
  }, [ad, ready, isVideoAd]);

  useEffect(() => {
    if (!visible || !ad || !ready || isVideoAd) return;
    if (imageCountdown <= 0) return;
    const t = setTimeout(() => setImageCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, ad, ready, imageCountdown, isVideoAd]);

  if (!visible || ad === undefined || !ad) return null;

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

  const canClose = isVideoAd
    ? canSkipVideoAd(ready, adCurrentTime, adDuration)
    : canSkipImageAd(ready, imageCountdown);

  const closeLabel = (() => {
    if (!ready) return 'Loading…';
    if (canClose) return null;
    if (isVideoAd) {
      if (adDuration <= 0) return 'Loading…';
      const remaining = videoAdSkipSecondsRemaining(adCurrentTime, adDuration);
      return `Close in ${remaining}s`;
    }
    return `Close in ${imageCountdown}s`;
  })();

  const onTimeUpdate = (currentTime: number, duration: number) => {
    setAdCurrentTime(currentTime);
    if (Number.isFinite(duration) && duration > 0) {
      setAdDuration(duration);
    }
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
          onError={() => onCloseRef.current()}
          onTimeUpdate={onTimeUpdate}
        />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (canClose) onClose();
      }}
    >
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={openAd}>
            <Text style={styles.sponsor} numberOfLines={1}>Sponsored · {ad.title}</Text>
          </Pressable>
          {canClose ? (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          ) : closeLabel ? (
            <Text style={styles.countdown}>{closeLabel}</Text>
          ) : null}
        </View>
        <AdMedia
          mediaUrl={mediaUrl}
          mediaType={ad.mediaType}
          style={styles.media}
          contentFit="cover"
          onReady={() => setReady(true)}
          onError={() => onCloseRef.current()}
          onTimeUpdate={onTimeUpdate}
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
