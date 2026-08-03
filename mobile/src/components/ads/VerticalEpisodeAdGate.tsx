import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  canSkipImageAd,
  canSkipVideoAd,
  POST_END_SKIP_MS,
  videoAdSkipSecondsRemaining,
} from '@/lib/ad-skip-timing';
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
  const [imageCountdown, setImageCountdown] = useState(5);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const postEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  onCompleteRef.current = onComplete;

  const isVideoAd = ad?.mediaType === 'video';

  const finish = useCallback(() => {
    if (postEndTimerRef.current) {
      clearTimeout(postEndTimerRef.current);
      postEndTimerRef.current = null;
    }
    onCompleteRef.current();
  }, []);

  const schedulePostEndSkip = useCallback(() => {
    if (postEndTimerRef.current) clearTimeout(postEndTimerRef.current);
    postEndTimerRef.current = setTimeout(() => {
      postEndTimerRef.current = null;
      onCompleteRef.current();
    }, POST_END_SKIP_MS);
  }, []);

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
    return () => {
      if (postEndTimerRef.current) clearTimeout(postEndTimerRef.current);
    };
  }, []);

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
        placement: 'vertical_episode',
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
    void Linking.openURL(ad.clickThroughUrl);
  };

  const canSkip = isVideoAd
    ? canSkipVideoAd(ready, adCurrentTime, adDuration)
    : canSkipImageAd(ready, imageCountdown);

  const skipLabel = (() => {
    if (!ready) return 'Loading…';
    if (canSkip) return null;
    if (isVideoAd) {
      if (adDuration <= 0) return 'Loading…';
      const remaining = videoAdSkipSecondsRemaining(adCurrentTime, adDuration);
      return `Skip in ${remaining}s`;
    }
    return `Skip in ${imageCountdown}s`;
  })();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => canSkip && finish()}
    >
      <View style={styles.screen}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={openAd} style={styles.sponsorPress}>
            <Text style={styles.sponsor}>Sponsored</Text>
          </Pressable>
          {canSkip ? (
            <Pressable style={styles.skipBtn} onPress={finish}>
              <Text style={styles.skipText}>Skip Ad</Text>
            </Pressable>
          ) : skipLabel ? (
            <Text style={styles.countdown}>{skipLabel}</Text>
          ) : null}
        </View>
        <AdMedia
          mediaUrl={mediaUrl}
          mediaType={ad.mediaType}
          style={styles.media}
          contentFit="cover"
          onReady={() => setReady(true)}
          onError={finish}
          onEnded={schedulePostEndSkip}
          onTimeUpdate={(currentTime, duration) => {
            setAdCurrentTime(currentTime);
            if (Number.isFinite(duration) && duration > 0) {
              setAdDuration(duration);
            }
          }}
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
  sponsorPress: { flexShrink: 0 },
  sponsor: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecorationLine: 'underline' },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  skipText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  countdown: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  media: { flex: 1, width: '100%' },
});
