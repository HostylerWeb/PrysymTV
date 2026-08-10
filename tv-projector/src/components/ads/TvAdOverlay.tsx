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
import {
  canSkipImageAd,
  canSkipVideoAd,
  POST_END_SKIP_MS,
  videoAdSkipSecondsRemaining,
} from '@/lib/ad-skip-timing';
import { colors, spacing, typography } from '@/theme/tokens';

type Props = {
  visible: boolean;
  placement: AdPlacement;
  videoId?: string;
  creatorId?: string;
  servedAd?: ServedAd | null;
  onComplete: () => void;
  inline?: boolean;
};

function resolveInitialAd(servedAd: ServedAd | null | undefined): ServedAd | null | undefined {
  if (servedAd === undefined) return undefined;
  return isValidServedAd(servedAd) ? servedAd : null;
}

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
  const [ad, setAd] = useState<ServedAd | null | undefined>(() => resolveInitialAd(servedAd));
  const [imageCountdown, setImageCountdown] = useState(5);
  const [adCurrentTime, setAdCurrentTime] = useState(0);
  const [adDuration, setAdDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const postEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const impressionTrackedRef = useRef(false);
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
      finish();
    }, POST_END_SKIP_MS);
  }, [finish]);

  useEffect(() => {
    if (!visible) {
      impressionTrackedRef.current = false;
      return;
    }

    if (!shouldShow || !isPlacementEnabled(placement)) {
      onCompleteRef.current();
      return;
    }

    if (servedAd !== undefined) {
      const valid = resolveInitialAd(servedAd);
      setAd(valid);
      setReady(false);
      setAdCurrentTime(0);
      setAdDuration(0);
      if (!valid) onCompleteRef.current();
      return;
    }

    let cancelled = false;
    setAd(undefined);
    setReady(false);

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
    if (!ad || impressionTrackedRef.current) return;
    impressionTrackedRef.current = true;
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
    if (!ad || !ready || isVideoAd) return;
    setImageCountdown(ad.skipAfterSeconds || 5);
  }, [ad, ready, isVideoAd]);

  useEffect(() => {
    if (!visible || !ad || !ready || isVideoAd) return;
    if (imageCountdown <= 0) return;
    const t = setTimeout(() => setImageCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, ad, ready, imageCountdown, isVideoAd]);

  if (!visible) return null;
  if (ad === undefined) {
    return (
      <View style={inline ? styles.inlineShell : styles.screen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!ad) return null;

  const mediaUrl = resolveAdMediaUrl(ad.mediaUrl);
  if (!mediaUrl) return null;

  const canSkip = isVideoAd
    ? canSkipVideoAd(ready, adCurrentTime, adDuration)
    : canSkipImageAd(ready, imageCountdown);

  const skipLabel = (() => {
    if (!ready) return null;
    if (canSkip) return null;
    if (isVideoAd) {
      if (adDuration <= 0) return 'Loading…';
      const remaining = videoAdSkipSecondsRemaining(adCurrentTime, adDuration);
      return `Skip in ${remaining}s`;
    }
    return `Skip in ${imageCountdown}s`;
  })();

  return (
    <View style={inline ? styles.inlineShell : styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.sponsor}>Sponsored</Text>
        {canSkip ? (
          <TvFocusButton
            label="Skip ad"
            hasTVPreferredFocus
            onPress={finish}
            style={styles.skipBtn}
          />
        ) : skipLabel ? (
          <View style={styles.skipHint}>
            <Text style={styles.skipText}>{skipLabel}</Text>
          </View>
        ) : (
          <Text style={styles.skipText}>Loading…</Text>
        )}
      </View>
      <View style={styles.player}>
        <AdMedia
          key={`${ad.id}-${mediaUrl}`}
          mediaUrl={mediaUrl}
          mediaType={ad.mediaType}
          style={styles.media}
          contentFit="contain"
          onReady={() => setReady(true)}
          onError={() => finish()}
          onEnded={schedulePostEndSkip}
          onTimeUpdate={(currentTime, duration) => {
            setAdCurrentTime(currentTime);
            if (Number.isFinite(duration) && duration > 0) {
              setAdDuration(duration);
            }
          }}
        />
      </View>
    </View>
  );
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
    elevation: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
    zIndex: 2,
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
    backgroundColor: '#000',
  },
  media: { width: '100%', height: '100%' },
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
