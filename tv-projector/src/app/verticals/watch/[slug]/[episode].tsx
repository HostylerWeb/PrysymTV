import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TvAdOverlay } from '@/components/ads/TvAdOverlay';
import { PlayerShell } from '@/components/video/PlayerShell';
import { useVerticalEpisodePlayback } from '@/hooks/api/useVerticalEpisodePlayback';
import { usePlaybackProgress } from '@/hooks/usePlaybackProgress';
import { useTvAdGate } from '@/hooks/useTvAdGate';
import { colors } from '@/theme/tokens';

export default function VerticalEpisodeWatchScreen() {
  const params = useLocalSearchParams<{ slug: string; episode: string }>();
  const episodeNumber = Number(params.episode);
  const { data, isLoading, error } = useVerticalEpisodePlayback(params.slug, episodeNumber);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [videoVisible, setVideoVisible] = useState(false);

  const adGate = useTvAdGate(
    'vertical_episode',
    data?.episode.id,
    Boolean(data?.episode.id),
  );

  useEffect(() => {
    setVideoVisible(false);
  }, [data?.episode.id, data?.playbackSource]);

  usePlaybackProgress(
    'vertical_episode',
    data?.episode.id,
    progressSeconds,
    data?.episode.durationSeconds ?? 0,
    !adGate.showOverlay && Boolean(data?.playbackSource) && videoVisible,
  );

  const shouldPlay = Boolean(data?.playbackSource) && !adGate.showOverlay;
  const waiting = isLoading;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />
      <TvAdOverlay
        visible={adGate.showOverlay}
        placement="vertical_episode"
        creatorId={data?.series.creatorId ?? undefined}
        videoId={data?.episode.id}
        servedAd={adGate.servedAd}
        onComplete={adGate.completeAd}
      />
      {data?.playbackSource ? (
        <PlayerShell
          title={`${data.series.title} · Ep ${data.episode.episodeNumber}`}
          subtitle={data.episode.title}
          playbackUrl={data.playbackSource}
          autoPlay={shouldPlay}
          contentFit="contain"
          onProgress={(seconds) => setProgressSeconds(seconds)}
          onPlaying={() => setVideoVisible(true)}
        />
      ) : null}
      {waiting || error ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.videoBackground },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.videoBackground,
  },
});
