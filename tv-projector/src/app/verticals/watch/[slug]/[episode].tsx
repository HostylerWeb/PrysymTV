import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TvWatchPlayerLayout } from '@/components/video/TvWatchPlayerLayout';
import { useVerticalEpisodePlayback } from '@/hooks/api/useVerticalEpisodePlayback';
import { withContentServiceGate } from '@/components/tv/ContentServiceGate';
import { colors } from '@/theme/tokens';

function VerticalEpisodeWatchScreen() {
  const params = useLocalSearchParams<{ slug: string; episode: string }>();
  const episodeNumber = Number(params.episode);
  const { data, isLoading, error } = useVerticalEpisodePlayback(params.slug, episodeNumber);

  const waiting = isLoading || (!data?.playbackSource && !error);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false, animation: 'none' }} />
      {data?.playbackSource ? (
        <TvWatchPlayerLayout
          contentId={data.episode.id}
          playbackUrl={data.playbackSource}
          title={`${data.series.title} · Ep ${data.episode.episodeNumber}`}
          subtitle={data.episode.title}
          posterUrl={data.series.posterUrl}
          adPlacement="vertical_episode"
          creatorId={data.series.creatorId ?? undefined}
          contentType="vertical_episode"
          durationSeconds={data.episode.durationSeconds ?? 0}
          contentFit="contain"
        />
      ) : null}
      {waiting ? (
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.videoBackground,
  },
});

export default withContentServiceGate('verticals', VerticalEpisodeWatchScreen);
