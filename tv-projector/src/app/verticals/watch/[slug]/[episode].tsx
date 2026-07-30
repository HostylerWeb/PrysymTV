import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TvAdOverlay } from '@/components/ads/TvAdOverlay';
import { PlayerShell } from '@/components/video/PlayerShell';
import {
  fetchServedAd,
  isValidServedAd,
  type ServedAd,
} from '@/lib/api/ads';
import { usePublicAdsConfig } from '@/hooks/api/usePublicAdsConfig';
import { useVerticalEpisodePlayback } from '@/hooks/api/useVerticalEpisodePlayback';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useShouldShowAds } from '@/hooks/useShouldShowAds';
import { colors } from '@/theme/tokens';

export default function VerticalEpisodeWatchScreen() {
  const params = useLocalSearchParams<{ slug: string; episode: string }>();
  const episodeNumber = Number(params.episode);
  const { data, isLoading, error } = useVerticalEpisodePlayback(params.slug, episodeNumber);
  const shouldShowAds = useShouldShowAds();
  const { isPlacementEnabled } = usePublicAdsConfig();

  const [gateOpen, setGateOpen] = useState(false);
  const [gateAd, setGateAd] = useState<ServedAd | null>(null);
  const [started, setStarted] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);

  useEffect(() => {
    if (!data?.episode.id) return;
    setStarted(false);
    setGateOpen(false);
    setGateAd(null);

    if (!shouldShowAds || !isPlacementEnabled('vertical_episode')) {
      setStarted(true);
      return;
    }

    void fetchServedAd('vertical_episode', { peek: true }).then((peek) => {
      if (!isValidServedAd(peek)) {
        setStarted(true);
        return;
      }
      setGateAd(peek);
      setGateOpen(true);
    });
  }, [data?.episode.id, shouldShowAds, isPlacementEnabled]);

  usePlaybackProgress(
    'vertical_episode',
    data?.episode.id,
    progressSeconds,
    data?.episode.durationSeconds ?? 0,
    started,
  );

  const title = data
    ? `${data.series.title} · Ep ${data.episode.episodeNumber}`
    : 'Vertical';

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <TvAdOverlay
        visible={gateOpen}
        placement="vertical_episode"
        creatorId={data?.series.creatorId ?? undefined}
        videoId={data?.episode.id}
        servedAd={gateAd}
        onComplete={() => {
          setGateOpen(false);
          setStarted(true);
        }}
      />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !data?.playbackSource ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : started ? (
        <View style={styles.playerWrap}>
          <PlayerShell
            title={title}
            subtitle={data.episode.title}
            playbackUrl={data.playbackSource}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playerWrap: { flex: 1, maxWidth: 720, alignSelf: 'center', width: '100%' },
});
