import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

type Props = {
  visible: boolean;
  videoId?: string;
  creatorId?: string;
  servedAd?: ServedAd | null;
  onComplete: () => void;
};

export function AdPreroll({ visible, videoId, creatorId, servedAd, onComplete }: Props) {
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

  const canSkip = ready && countdown <= 0;

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

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => canSkip && onComplete()}>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.player}>
          <AdMedia
            mediaUrl={mediaUrl}
            mediaType={ad.mediaType}
            style={styles.media}
            contentFit="contain"
            onReady={() => setReady(true)}
            onError={() => onCompleteRef.current()}
            onEnded={() => onCompleteRef.current()}
          />
          {ready && canSkip ? (
            <Pressable style={styles.skipBtn} onPress={onComplete}>
              <Text style={styles.skipText}>Skip</Text>
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          ) : ready ? (
            <View style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip in {countdown}s</Text>
            </View>
          ) : null}
          {ready && ad.title ? (
            <Pressable style={styles.adLink} onPress={openAd}>
              <Text style={styles.adLinkText}>{ad.title}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  player: { width: '100%', aspectRatio: 16 / 9, justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  skipBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  skipText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  adLink: { position: 'absolute', bottom: 12, left: 12 },
  adLinkText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textDecorationLine: 'underline' },
});
