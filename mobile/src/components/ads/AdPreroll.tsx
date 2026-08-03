import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { radius } from '@/theme/tokens';

const POST_END_SKIP_MS = 3000;

type Props = {
  visible: boolean;
  videoId?: string;
  creatorId?: string;
  servedAd?: ServedAd | null;
  onComplete: () => void;
  /** Fill the parent player frame instead of a full-screen modal. */
  inline?: boolean;
};

export function AdPreroll({
  visible,
  videoId,
  creatorId,
  servedAd,
  onComplete,
  inline = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const shouldShow = useShouldShowAds();
  const { user } = useMockAuth();
  const { platformCreatorId, isPlacementEnabled } = usePublicAdsConfig();
  const [ad, setAd] = useState<ServedAd | null | undefined>(undefined);
  const [countdown, setCountdown] = useState(5);
  const [ready, setReady] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const postEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  onCompleteRef.current = onComplete;

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
      return;
    }
    setReady(false);
    if (!shouldShow || !isPlacementEnabled('movie_preroll')) {
      onCompleteRef.current();
      return;
    }

    if (servedAd !== undefined) {
      const valid = isValidServedAd(servedAd) ? servedAd : null;
      setAd(valid);
      if (!valid) onCompleteRef.current();
      return;
    }

    void fetchServedAd('movie_preroll', { peek: true })
      .then((peek) => {
        if (!isValidServedAd(peek)) {
          onCompleteRef.current();
          return;
        }
        return fetchServedAd('movie_preroll').then((served) => {
          const valid = isValidServedAd(served) ? served : null;
          setAd(valid);
          if (!valid) onCompleteRef.current();
        });
      })
      .catch(() => onCompleteRef.current());
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
        placement: 'movie_preroll',
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
  }, [ad, creatorId, videoId, platformCreatorId, user?.id]);

  useEffect(() => {
    if (!visible || !ad || !ready || countdown <= 0) return;
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
        placement: 'movie_preroll',
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
    void Linking.openURL(ad.clickThroughUrl);
  };

  const canSkip = ready && countdown <= 0;

  const content = (
    <View style={[inline ? styles.inlineShell : styles.screen, !inline && { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={openAd}>
          <Text style={styles.sponsor}>Sponsored</Text>
        </Pressable>
        {canSkip ? (
          <Pressable style={styles.skipBtn} onPress={finish}>
            <Text style={styles.skipText}>Skip Ad</Text>
          </Pressable>
        ) : ready ? (
          <Text style={styles.countdown}>Skip in {countdown}s</Text>
        ) : (
          <Text style={styles.countdown}>Loading…</Text>
        )}
      </View>
      <View style={styles.player}>
        <AdMedia
          mediaUrl={mediaUrl}
          mediaType={ad.mediaType}
          style={styles.media}
          contentFit="contain"
          onReady={() => setReady(true)}
          onError={finish}
          onEnded={schedulePostEndSkip}
        />
        {!ready ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}
      </View>
    </View>
  );

  if (inline) return content;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => canSkip && finish()}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  inlineShell: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  sponsor: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textDecorationLine: 'underline' },
  player: { flex: 1, width: '100%', justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  skipBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  skipText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  countdown: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
