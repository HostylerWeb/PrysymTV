import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  buildAdAttribution,
  fetchServedAd,
  isValidServedAd,
  trackAdImpression,
  type AdPlacement,
  type ServedAd,
} from '@/lib/api/ads';
import { AdMedia } from '@/components/ads/AdMedia';
import { TvFocusButton } from '@/components/tv/TvFocusButton';
import { useAuth } from '@/context/AuthContext';
import { usePublicAdsConfig } from '@/hooks/api/usePublicAdsConfig';
import { useShouldShowAds } from '@/hooks/useShouldShowAds';
import { resolveAdMediaUrl } from '@/lib/ad-media';
import { colors, spacing, typography } from '@/theme/tokens';

const POST_END_SKIP_MS = 3000;

type Props = {
  visible: boolean;
  placement: AdPlacement;
  videoId?: string;
  creatorId?: string;
  servedAd?: ServedAd | null;
  onComplete: () => void;
  /** Render inside the player frame instead of a full-screen modal. */
  inline?: boolean;
};

export function TvAdOverlay({
  visible,
  placement,
  videoId,
  creatorId,
  servedAd,
  onComplete,
  inline = false,
}: Props) {
  const shouldShow = useShouldShowAds();
  const { user } = useAuth();
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
      finish();
    }, POST_END_SKIP_MS);
  }, [finish]);

  useEffect(() => {
    if (!visible) {
      setAd(undefined);
      setReady(false);
      return;
    }

    setReady(false);

    if (!shouldShow || !isPlacementEnabled(placement)) {
      onCompleteRef.current();
      return;
    }

    if (servedAd !== undefined) {
      const valid = isValidServedAd(servedAd) ? servedAd : null;
      setAd(valid);
      if (!valid) onCompleteRef.current();
      return;
    }

    let cancelled = false;
    void fetchServedAd(placement, { peek: true })
      .then((peek) => {
        if (cancelled) return;
        if (!isValidServedAd(peek)) {
          onCompleteRef.current();
          return;
        }
        return fetchServedAd(placement).then((served) => {
          if (cancelled) return;
          const valid = isValidServedAd(served) ? served : null;
          setAd(valid);
          if (!valid) onCompleteRef.current();
        });
      })
      .catch(() => {
        if (!cancelled) onCompleteRef.current();
      });

    return () => {
      cancelled = true;
    };
  }, [visible, shouldShow, servedAd, isPlacementEnabled, placement]);

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
        placement,
        creatorId,
        platformCreatorId,
        videoId,
        viewerUserId: user?.id,
      }),
    );
  }, [ad, creatorId, videoId, platformCreatorId, user?.id, placement]);

  useEffect(() => {
    if (!visible || !ad || !ready || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, ad, ready, countdown]);

  useEffect(() => {
    if (!visible || ad === undefined) return;
    if (ad && ready) setCountdown(ad.skipAfterSeconds);
  }, [visible, ad, ready]);

  useEffect(() => {
    if (!visible || ad === undefined || !ad) return;
    const mediaUrl = resolveAdMediaUrl(ad.mediaUrl);
    if (!mediaUrl) onCompleteRef.current();
  }, [visible, ad]);

  if (!visible || ad === undefined || !ad) return null;

  const mediaUrl = resolveAdMediaUrl(ad.mediaUrl);
  if (!mediaUrl) return null;

  const canSkip = ready && countdown <= 0;

  const content = (
    <View style={inline ? styles.inlineShell : styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.sponsor}>Sponsored</Text>
        {ready && canSkip ? (
          <TvFocusButton
            label="Skip ad"
            hasTVPreferredFocus
            onPress={finish}
            style={styles.skipBtn}
          />
        ) : ready ? (
          <View style={styles.skipHint}>
            <Text style={styles.skipText}>Skip in {countdown}s</Text>
          </View>
        ) : (
          <Text style={styles.skipText}>Loading…</Text>
        )}
      </View>
      <View style={styles.player}>
        <AdMedia
          mediaUrl={mediaUrl}
          mediaType={ad.mediaType}
          style={styles.media}
          contentFit="contain"
          onReady={() => setReady(true)}
          onError={() => finish()}
          onEnded={schedulePostEndSkip}
        />
        {!ready ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
      </View>
    </View>
  );

  return content;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineShell: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  sponsor: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.caption,
    textDecorationLine: 'underline',
  },
  player: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  media: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  skipBtn: {
    minWidth: 160,
  },
  skipHint: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  skipText: { color: colors.foreground, fontSize: typography.body, fontWeight: '600' },
});
